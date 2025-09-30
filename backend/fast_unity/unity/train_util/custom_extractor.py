import gym
import torch
import torch.nn as nn
from stable_baselines3 import DQN
from stable_baselines3.common.torch_layers import BaseFeaturesExtractor
from typing import Dict

# 64x64 이미지와 벡터 입력을 함께 처리하는 커스텀 특징 추출기
class CustomCombinedExtractorFor64x64(BaseFeaturesExtractor):
    def __init__(self, observation_space: gym.spaces.Dict, cnn_output_dim: int = 128):
        # features_dim은 모든 입력에서 추출된 특징 벡터들을 합친 최종 크기입니다.
        # 나중에 계산되므로 여기서는 임시로 1을 넣습니다.
        super().__init__(observation_space, features_dim=1)

        extractors = {}
        total_concat_size = 0

        # ML-Agents에서 observation_space.spaces.keys()를 통해 실제 키를 확인하세요.
        # 예: dict_keys(['obs_0', 'obs_1', 'obs_2'])
        # 여기서는 설명을 위해 'image', 'vector'로 가정합니다.
        for key, subspace in observation_space.spaces.items():
            # 이미지 관측(RenderTexture)을 위한 처리
            if key == "obs_1": # 'obs_0' 등 실제 키로 변경해야 합니다.
                n_input_channels = subspace.shape[0]
                cnn = nn.Sequential(
                    nn.Conv2d(n_input_channels, 32, kernel_size=5, stride=2, padding=2),
                    nn.ReLU(),
                    nn.Conv2d(32, 64, kernel_size=3, stride=2, padding=1),
                    nn.ReLU(),
                    nn.Conv2d(64, 64, kernel_size=3, stride=2, padding=1),
                    nn.ReLU(),
                    nn.Flatten(),
                )

                # CNN을 통과한 후의 벡터 크기 계산
                with torch.no_grad():
                    sample_input = torch.as_tensor(subspace.sample()[None]).float()
                    n_flatten = cnn(sample_input).shape[1]

                # CNN 출력물을 최종 특징 차원으로 매핑하는 선형 계층
                linear = nn.Sequential(nn.Linear(n_flatten, cnn_output_dim), nn.ReLU())
                
                extractors[key] = nn.Sequential(cnn, linear)
                total_concat_size += cnn_output_dim
            
            # 벡터 관측(addObservation, RayPerception)을 위한 처리
            else:
                # 벡터 데이터는 별도 처리 없이 그대로 사용
                extractors[key] = nn.Identity()
                total_concat_size += subspace.shape[0]

        self.extractors = nn.ModuleDict(extractors)
        
        # 최종 특징 차원 업데이트
        self._features_dim = total_concat_size

    def forward(self, observations: Dict[str, torch.Tensor]) -> torch.Tensor:
        encoded_tensor_list = []
        # 각 관측(key)에 맞는 extractor를 적용
        for key, extractor in self.extractors.items():
            encoded_tensor_list.append(extractor(observations[key]))
        
        # 모든 특징 벡터를 하나로 결합
        return torch.cat(encoded_tensor_list, dim=1)

import gym
import torch
import torch.nn as nn
from stable_baselines3.common.torch_layers import BaseFeaturesExtractor
from typing import Dict

class AdvancedCombinedExtractorMultipleVectors(BaseFeaturesExtractor):
    """
    이미지(obs_1)와 여러 벡터(obs_0, obs_2 등) 입력을 처리하는 커스텀 특징 추출기.
    - 이미지는 커스텀 CNN으로 처리.
    - 각 벡터 입력은 각각의 작은 MLP로 처리하여 표현력을 높이고 차원 균형을 맞춤.
    """
    def __init__(self, observation_space: gym.spaces.Dict, cnn_output_dim: int = 128, vector_output_dim: int = 64):
        super().__init__(observation_space, features_dim=1) # 최종 차원은 나중에 계산

        extractors = {}
        total_concat_size = 0

        # 각 관측(obs_0, obs_1, obs_2)에 대해 반복
        for key, subspace in observation_space.spaces.items():
            # 1. 이미지 관측(obs_1) 처리
            if key == "obs_0":
                n_input_channels = subspace.shape[0] # SB3가 (C, H, W)로 바꿔줌
                cnn = nn.Sequential(
                    nn.Conv2d(n_input_channels, 32, kernel_size=5, stride=2, padding=2),
                    nn.ReLU(),
                    nn.Conv2d(32, 64, kernel_size=3, stride=2, padding=1),
                    nn.ReLU(),
                    nn.Conv2d(64, 64, kernel_size=3, stride=2, padding=1),
                    nn.ReLU(),
                    nn.Flatten(),
                )
                
                # CNN 출력 크기 계산
                with torch.no_grad():
                    sample_input = torch.as_tensor(subspace.sample()[None]).float()
                    n_flatten = cnn(sample_input).shape[1]

                # 최종 이미지 특징 벡터 생성
                linear = nn.Sequential(nn.Linear(n_flatten, cnn_output_dim), nn.ReLU())
                
                extractors[key] = nn.Sequential(cnn, linear)
                total_concat_size += cnn_output_dim

            # 2. 벡터 관측(obs_0, obs_2 등) 처리
            else:
                if(key == "obs_2"): 
                    output = 32
                else : 
                    output= 64
                input_dim = subspace.shape[0]
                vector_mlp = nn.Sequential(
                    nn.Linear(input_dim, 128),
                    nn.ReLU(),
                    nn.Linear(128, output),
                    nn.ReLU(),
                )
                extractors[key] = vector_mlp
                total_concat_size += output

        self.extractors = nn.ModuleDict(extractors)
        
        # 3. 모든 특징 벡터를 합친 최종 차원 설정
        self._features_dim = total_concat_size

    def forward(self, observations: Dict[str, torch.Tensor]) -> torch.Tensor:
        encoded_tensor_list = []
        # 각 관측(obs_0, obs_1, obs_2)을 맞는 처리기로 처리
        for key, extractor in self.extractors.items():
            encoded_tensor_list.append(extractor(observations[key]))
        
        # 모든 처리된 특징 벡터를 하나로 결합
        return torch.cat(encoded_tensor_list, dim=1)

