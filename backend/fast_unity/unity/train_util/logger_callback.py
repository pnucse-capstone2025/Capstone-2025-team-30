# callback_episode_csv.py
import csv
import os
from datetime import datetime
from stable_baselines3.common.callbacks import BaseCallback

class EpisodeCSVCallback(BaseCallback):
    """
    dones가 True 될 때마다 infos[i]["episode"]에서
    에피소드 리워드/길이를 읽어 CSV에 기록합니다.
    """
    def __init__(self, save_dir: str , filename: str): #uuid등을 붙여서 기록해야함.
        super().__init__()
        self.save_dir = save_dir
        self.filename = filename
        self.file = None
        self.writer = None
        self.episode_count = 0

    def _on_training_start(self) -> None:
        os.makedirs(self.save_dir, exist_ok=True)
        path = os.path.join(self.save_dir, self.filename)
        self.file = open(path, "w", newline="", encoding="utf-8")
        self.writer = csv.writer(self.file)
        # 원하는 컬럼 추가/수정 가능
        self.writer.writerow([
            "ts",                 # 현재 timesteps
            
            "episode_index",      # 진행된 에피소드 누계
            "env_index",          # 어떤 벡터환경 인덱스에서 끝났는지
            "episode_reward",
            "episode_length",
            "wall_time"           # 벽시계 시각(로그 시점)
        ])

    def _on_step(self) -> bool:
        # VecEnv 기준
        dones = self.locals.get("dones", [])
        infos = self.locals.get("infos", [])

        if self.num_timesteps % 100== 0:
            
            
            payload = {
                "step": self.num_timesteps,
                "logs": self.logger.name_to_value.copy()
            }
            #print("Metric")
            #print(payload)
            
        for env_idx, done in enumerate(dones):
            if done:
                ep_info = infos[env_idx].get("episode")
                if ep_info is not None:
                    self.episode_count += 1
                    self.writer.writerow([
                        self.num_timesteps,
                        self.episode_count,
                        env_idx,
                        ep_info.get("r", None),
                        ep_info.get("l", None),
                        datetime.now().isoformat(timespec="seconds"),
                    ])
        return True

    def _on_training_end(self) -> None:
        if self.file is not None:
            self.file.flush()
            self.file.close()
            self.file = None
