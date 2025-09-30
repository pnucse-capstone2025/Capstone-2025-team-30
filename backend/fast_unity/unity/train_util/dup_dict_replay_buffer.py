from typing import Any, Dict, List, Union

import numpy as np
from stable_baselines3.common.buffers import DictReplayBuffer


class DupDictReplayBuffer(DictReplayBuffer):
    """
    '동적 카운트(cnt)'에 따라 동일 트랜지션을 여러 번 저장하는 커스텀 ReplayBuffer. (Dict 관측용)

    - TeacherFeedbackWrapper가 info["tfw_cnt"]에 넣어준 값을 읽어
      해당 스텝을 동일하게 cnt번 반복 저장합니다.
    - 현재 구현은 단일 환경(n_envs=1) 사용을 가정합니다.
    """

    def add(
        self,
        obs: Dict[str, np.ndarray],
        next_obs: Dict[str, np.ndarray],
        action: np.ndarray,
        reward: np.ndarray,
        done: np.ndarray,
        infos: List[Dict[str, Any]],
    ) -> None:
        if self.n_envs != 1:
            raise NotImplementedError(
                "DupDictReplayBuffer는 현재 n_envs=1만 지원합니다."
            )

        # 기본값: 1회 저장
        cnt = 1
        if isinstance(infos, (list, tuple)) and len(infos) > 0 and isinstance(infos[0], dict):
            try:
                cnt = int(infos[0].get("tfw_cnt", 1))
            except Exception:
                cnt = 1

        # 동일 전이를 cnt번 반복 저장
        for _ in range(max(1, cnt)):
            super().add(obs, next_obs, action, reward, done, infos)