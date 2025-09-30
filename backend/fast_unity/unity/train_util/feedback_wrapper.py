
from typing import Callable, Optional, Tuple, Union
import gymnasium as gym
import numpy as np
from typing import Dict

def cnt_for_fb(fb: int, steps_since_warmup: int, total_remaining_steps: int) -> int:
    """'동적 카운트' 전략: 학습 진행도(스텝 기반)에 따라 피드백 강도를 조절"""
    if total_remaining_steps <= 0:
        return 1

    progress = min(1.0, steps_since_warmup / float(total_remaining_steps))

    if fb == 1:      # positive
        base_cnt = 4
        return max(1, int(base_cnt * (1 - progress * 0.5)))
    elif fb == 0:    # neutral
        return 1
    else:            # negative
        base_cnt = 3
        return max(1, int(base_cnt * (1 - progress * 0.3)))


def to_feedback(dist: float, pos_th: float = 0.1, neu_th: float = 0.4) -> int:
    """거리 기반 등급화: +1 / 0 / -1 (사용자 임계값 유지)"""
    if dist <= pos_th:
        return 1
    elif dist <= neu_th:
        return 0
    else:
        return -1
    
action_map = {
    0: (0, -1,1),  1: (-1, 0,1),  2: (-1, 1,1),
    3: ( -1, -1,1),  4: ( 0, 0,1),  5: ( 0, 1,1),
    6: ( 1, -1,1),  7: ( 1, 0,1),  8: ( 1, 1,1),
    9: ( -1, 1,-1),  10: ( -1, 0,-1),  11: (-1,-1,-1),
    12: ( 0, 1,-1),  13: ( 0, 0,-1),  14: ( 0, -1,-1),
    15: ( 1, 1,-1),  16: ( 1, 0,-1),  17: ( 1, -1,-1)
}
Vector3 = Tuple[float, float, float]
def action_distance(i, j, actions, max_dist=2.0):
    a1, a2 = actions[i], actions[j]
    norm_a1 = np.linalg.norm(a1)
    norm_a2 = np.linalg.norm(a2)
    if norm_a1 == 0 and norm_a2 == 0:
        return 0.0
    elif norm_a1 == 0 or norm_a2 == 0:
        return 1.0
    dot_product = np.dot(a1, a2)
    cosine_sim = dot_product / (norm_a1 * norm_a2)
    cosine_dist = 1 - cosine_sim
    return cosine_dist / max_dist



class TeacherFeedbackWrapper(gym.Wrapper):
    """
    SB3 호환 Unity Gym 환경용 보상-셰이핑 + 정보부착 래퍼.

    - 교사(teacher) 행동과 학생(action) 차이를 바탕으로
      (1) 추가 보상(= FEEDBACK_WEIGHT * fb)을 즉시 부여하고,
      (2) info에 'tfw_feedback', 'tfw_cnt' 등을 넣어줍니다.
    - 이산/연속 행동공간 모두 지원합니다.
    - WARMUP_EPISODES 동안은 피드백을 비활성화합니다(원 코드와 동일: *에피소드 기준*).
    - total_episodes_hint를 이용해 cnt_for_fb의 '진행도'를 계산합니다.
    - teacher는 다음 중 하나여야 합니다:
        • Callable[[obs(ndarray)], action]
        • SB3 모델 객체: .predict(obs, deterministic=True) 제공
    """
    def __init__(
        self,
        env: gym.Env,
        teacher: Optional[Union[Callable[[np.ndarray], Union[int, np.ndarray]], object]] = None,
        total_timesteps: int = 1_000_000,
        feedback_weight: float = 0.05,
        warmup_fraction: float = 0.05,
        thresholds: Tuple[float, float] = (0.1, 0.4),
        verbose: int = 1,
    ):
        super().__init__(env)
        self.teacher = teacher
        self.total_timesteps = total_timesteps
        self.feedback_weight = float(feedback_weight)
        self.warmup_end_step = int(total_timesteps * warmup_fraction)
        self.pos_th, self.neu_th = thresholds
        self.verbose = int(verbose)

        # 내부 상태
        self._episode_idx = 0           # 0부터 시작
        self._last_obs = None
        self._total_step = 0
        # 통계
        self._fb_pos = 0
        self._fb_neu = 0
        self._fb_neg = 0
        
        # 벡터 가중치
        self.wx = 1
        self.wy = 1
        self.wp = 1
        self.weighted_map = self.apply(action_map)

        
    def apply(self, action_map: Dict[int, Vector3]) -> Dict[int,Vector3]:
        """
        action_map: {action_index: (steer_x, steer_y, pedal_signed)}
        return:     같은 키를 가지되 각 요소에 가중치가 곱해진 dict
        """
        weighted = {}
        for k, (x, y, p) in action_map.items():
            weighted[k] = (x * self.wx, y * self.wy, p * self.wp)
        return weighted    

    # ──────────────────────────────────────────────────────────────────────────
    # 유틸
    # ──────────────────────────────────────────────────────────────────────────
    def _call_teacher(self, obs: np.ndarray):
        if self.teacher is None:
          
            return None
        if hasattr(self.teacher, "predict"):
            act, _ = self.teacher.predict(obs, deterministic=True)
            return act
        if callable(self.teacher):
            return self.teacher(obs)
    
        return None

    @staticmethod
    def _cosine_distance(a: np.ndarray, b: np.ndarray) -> float:
        a = np.asarray(a, dtype=np.float32).reshape(-1)
        b = np.asarray(b, dtype=np.float32).reshape(-1)
        na, nb = np.linalg.norm(a), np.linalg.norm(b)
        if na == 0.0 and nb == 0.0:
            return 0.0
        if na == 0.0 or nb == 0.0:
            return 1.0
        cos_sim = float(np.dot(a, b) / (na * nb))
        return float(1.0 - cos_sim)  # 코사인 거리

    # ──────────────────────────────────────────────────────────────────────────
    # Gym API
    # ──────────────────────────────────────────────────────────────────────────
    def reset(self, *, seed=None, options=None):
        if self._episode_idx > 0 and self.verbose > 0:
            print(f"[TFW] Ep{self._episode_idx:04d} FB(+ {self._fb_pos} / 0 {self._fb_neu} / - {self._fb_neg})")
        self._fb_pos = self._fb_neu = self._fb_neg = 0
        obs, info = self.env.reset(seed=seed, options=options)
        self._last_obs = obs
        return obs, info

    def step(self, action):
        self._total_step += 1
        # teacher 행동 (현재 관찰 기준)
        teacher_action = self._call_teacher(self._last_obs)

        fb = 0
        cnt = 1
        shaped = 0.0

        is_warmup = self._total_step < self.warmup_end_step
        if teacher_action is not None and not is_warmup:
            if isinstance(self.action_space, gym.spaces.Discrete):
                stud = int(action if not isinstance(action, np.ndarray) else int(action.item()))
                teach = int(teacher_action if not isinstance(teacher_action, np.ndarray) else int(teacher_action.item()))
                #  여기서 코사인 적용 시키기.
                dist = action_distance(stud, teach, self.weighted_map)
                fb = to_feedback(dist, self.pos_th, self.neu_th)
            else:
                stud = np.asarray(action).reshape(-1)
                teach = np.asarray(teacher_action).reshape(-1)
                dist = self._cosine_distance(stud, teach)
                fb = to_feedback(dist, self.pos_th, self.neu_th)

            # 스텝 기반으로 cnt 계산
            steps_since_warmup = max(0, self._total_step - self.warmup_end_step)
            total_remaining_steps = max(1, self.total_timesteps - self._total_step)
            cnt = cnt_for_fb(fb, steps_since_warmup, total_remaining_steps)

            # 보상 셰이핑
            shaped = self.feedback_weight * float(fb) * (1 - (self._total_step / self.total_timesteps))
            if fb > 0:
                self._fb_pos += 1
            elif fb < 0:
                self._fb_neg += 1
            else:
                self._fb_neu += 1

        # 환경 스텝
        next_obs, reward, terminated, truncated, info = self.env.step(action)
        reward = float(reward) + shaped

        # 에피소드 종료 시점
        if terminated or truncated:
            self._episode_idx += 1

        # 다음 관찰 대입
        self._last_obs = next_obs

        # info 확장: (피드백/증폭카운트/셰이핑 등)
        info = dict(info) if info is not None else {}
        info.update({
            "tfw_feedback": fb,
            "tfw_cnt": int(cnt),
            "tfw_shaped_reward": shaped,
            "tfw_is_warmup": is_warmup,
        })
        return next_obs, reward, terminated, truncated, info
