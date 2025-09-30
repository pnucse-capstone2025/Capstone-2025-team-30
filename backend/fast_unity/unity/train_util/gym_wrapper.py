import numpy as np
import gymnasium as gym
from gymnasium import spaces
from mlagents_envs.environment import UnityEnvironment
from mlagents_envs.base_env import ActionTuple
from unity.train_util.sidechannel import RLSideChannel

def _flat_index_to_branches(idx: int, branches):
    out = []
    for b in reversed(branches):
        out.append(idx % b)
        idx //= b
    return list(reversed(out))

class MLAgentsGymWrapper(gym.Env):
    """
    act_mode:
      - "discrete": Unity 이산을 그대로 노출 (DQN/A2C/PPO)
      - "binning" : RL은 Box([-1,1], n_branches)로 내고, step에서 이산으로 스냅(SAC)
    """
    metadata = {"render_modes": []}

    def __init__(self, unity_env_path, worker_id=0, side_channels=None,
                 use_dict_obs=False, act_mode: str = "discrete"):
        super().__init__()
        assert act_mode in ("discrete", "binning")
        self.act_mode = act_mode
        self.use_dict_obs = use_dict_obs
        self.side_channel = side_channels or RLSideChannel()

        add_args = ["-screen-width","640","-screen-height","360","-logFile","-"]
        self.unity_env = UnityEnvironment(
            file_name=unity_env_path, base_port=5005, no_graphics=False,
            worker_id=worker_id, side_channels=[self.side_channel], additional_args=add_args
        )
        self.unity_env.reset()

        self.behavior_name = list(self.unity_env.behavior_specs)[0]
        spec = self.unity_env.behavior_specs[self.behavior_name]

        # ------ obs space
        if self.use_dict_obs:
            obs_spaces = {}
            for i, o in enumerate(spec.observation_specs):
                key = f"obs_{i}"
                if len(o.shape) == 3:  # (H,W,C)
                    h,w,c = o.shape
                    obs_spaces[key] = spaces.Box(0, 255, shape=(h,w,c), dtype=np.uint8)
                else:
                    obs_spaces[key] = spaces.Box(-np.inf, np.inf, shape=o.shape, dtype=np.float32)
            self.observation_space = spaces.Dict(obs_spaces)
        else:
            total = int(sum(np.prod(o.shape) for o in spec.observation_specs))
            self.observation_space = spaces.Box(-np.inf, np.inf, shape=(total,), dtype=np.float32)

        # ------ action space (Unity는 이산 가정)
        assert spec.action_spec.is_discrete(), "이 래퍼는 Unity 이산 행동만 지원합니다."
        self.branches = list(spec.action_spec.discrete_branches)  # e.g. [9] or [3,3]
        self.n_branches = len(self.branches)
        self.n_discrete = int(np.prod(self.branches))

        if self.act_mode == "discrete":
            # 멀티브랜치도 단일 Discrete로 평탄화
 
            self.action_space = spaces.Discrete(self.n_discrete)
        else:  # binning for SAC

            self.action_space = spaces.Box(low=-1.0, high=1.0, shape=(self.n_branches,), dtype=np.float32)

        self.is_closed = False

    # ---------- helpers ----------
    def _pack_obs(self, steps):
        if self.use_dict_obs:
            out = {}
            for i, arr in enumerate(steps.obs):
                key = f"obs_{i}"
                if arr.ndim == 4:  # (N,H,W,C)
                    out[key] = (arr[0] * 255).clip(0,255).astype(np.uint8)
                else:
                    out[key] = arr[0].astype(np.float32, copy=False)
            return out
        else:
            return np.concatenate([a[0].ravel() for a in steps.obs]).astype(np.float32, copy=False)

    @staticmethod
    def _bin(a: float, bins: int) -> int:
        a = float(np.clip(a, -1.0, 1.0))
        idx = int(np.round(((a + 1.0) / 2.0) * (bins - 1)))
        return int(np.clip(idx, 0, bins - 1))

    # ---------- Gym API ----------
    def reset(self, *, seed=None, options=None):
        super().reset(seed=seed)
        self.unity_env.reset()
        d, t = self.unity_env.get_steps(self.behavior_name)
        steps = d if len(d) > 0 else t
        return self._pack_obs(steps), {}

    def step(self, action):
        # ---- map action to Unity ----
        if self.act_mode == "discrete":
            # SB3가 ndarray로 줄 수도 있음 → int로
            flat_idx = int(np.asarray(action).reshape(-1)[0])
            if self.n_branches == 1:
                branches_idx = [flat_idx]
            else:
                branches_idx = _flat_index_to_branches(flat_idx, self.branches)
            action_tuple = ActionTuple(discrete=np.array([branches_idx], dtype=np.int32))
        else:
            # binning: Box([-1,1], n_branches) → 브랜치별 이산
            a = np.asarray(action, dtype=np.float32).reshape(-1)
            assert a.shape[0] == self.n_branches, "Box 액션 길이가 브랜치 수와 다릅니다."
            branches_idx = [self._bin(a[i], self.branches[i]) for i in range(self.n_branches)]
            action_tuple = ActionTuple(discrete=np.array([branches_idx], dtype=np.int32))

        self.unity_env.set_actions(self.behavior_name, action_tuple)
        self.unity_env.step()

        d, t = self.unity_env.get_steps(self.behavior_name)
        steps = d if len(d) > 0 else t
        terminated = len(d) == 0
        obs = self._pack_obs(steps)
        reward = float(steps.reward[0])
        truncated = False
        info = {}
        return obs, reward, terminated, truncated, info

    def close(self):
        if not self.is_closed:
            self.unity_env.close()
            self.is_closed = True
