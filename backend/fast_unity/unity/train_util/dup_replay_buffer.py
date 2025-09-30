from typing import Any, Dict, List, Union

import numpy as np
from stable_baselines3.common.buffers import ReplayBuffer


class DupReplayBuffer(ReplayBuffer):
    """
    '동적 카운트(cnt)'에 따라 동일 트랜지션을 여러 번 저장하는 커스텀 ReplayBuffer.

    - TeacherFeedbackWrapper가 info["tfw_cnt"]에 넣어준 값을 읽어
      해당 스텝을 동일하게 cnt번 반복 저장합니다.
    - 현재 구현은 단일 환경(n_envs=1) 사용을 가정합니다.
      (Unity 실행을 single-env로 돌리는 일반적인 설정에 부합)
    """

    def add(
        self,
        obs: Union[np.ndarray, Dict[str, np.ndarray]],
        next_obs: Union[np.ndarray, Dict[str, np.ndarray]],
        action: np.ndarray,
        reward: np.ndarray,
        done: np.ndarray,
        infos: List[Dict[str, Any]],
    ) -> None:
        # 멀티 환경일 경우에는 per-env로 쪼개어 중복 삽입하는 로직을 별도로 구현해야 합니다.
        if self.n_envs != 1:
            raise NotImplementedError(
                "DupReplayBuffer는 현재 n_envs=1만 지원합니다. "
                "멀티 환경을 쓰려면 per-env로 분기하여 add 호출을 확장하세요."
            )

        # 기본값: 1회 저장
        cnt = 1
        if isinstance(infos, (list, tuple)) and len(infos) > 0 and isinstance(infos[0], dict):
            try:
                cnt = int(infos[0].get("tfw_cnt", 1))
            except Exception:
                cnt = 1

        cnt = max(1, cnt)

        # 동일 전이를 cnt번 반복 저장
        for _ in range(cnt):
            super().add(obs, next_obs, action, reward, done, infos)
