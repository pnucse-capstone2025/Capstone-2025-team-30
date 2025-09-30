from stable_baselines3.dqn.policies import DQNPolicy, MultiInputPolicy
from stable_baselines3 import DQN
import torch



class DiffrentRLPolicy(MultiInputPolicy):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        print("Using custom DQN Policy with different RL.")

    def make_optimizer(self) -> None:
        # 기본 옵티마이저 클래스/kwargs는 self.optimizer_class/self.optimizer_kwargs
        cnn_params = list(self.features_extractor.parameters())
        # q_net은 features → mlp(head) → q
        head_params = [p for n, p in self.q_net.named_parameters() if "features_extractor" not in n]

        cnn_lr = self.optimizer_kwargs.pop("cnn_lr", 0.000005)
        fc_lr  = self.optimizer_kwargs.pop("fc_lr", 0.00002)

        self.optimizer = self.optimizer_class(
            [
                {"params": cnn_params,  "lr": cnn_lr, "name": "cnn"},
                {"params": head_params, "lr": fc_lr,  "name": "fc"},
            ],
            **self.optimizer_kwargs,
        )
        

