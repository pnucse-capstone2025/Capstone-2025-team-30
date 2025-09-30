ALGO_LIST = ["dqn", "ppo", "a2c", "sac","tsc", "hf-llm"]

ALGO_SCHEMAS={
    "ppo": {
        "groups": [
            {"id": "general", "label": "General"},
            {"id": "ppo", "label": "PPO Specific"},
            {"id": "loss", "label": "Loss Coefficients"}
        ],
        "fields": [
            {"key": "learning_rate", "label": "Learning Rate", "group": "general", "type": "float", "default": 0.0003, "min": 1e-5, "max": 0.1, "step": 1e-5, "help": "The learning rate for the optimizer."},
            {"key": "gamma", "label": "Gamma (Discount Factor)", "group": "general", "type": "float", "default": 0.99, "min": 0.8, "max": 0.9999, "step": 0.001, "help": "Discount factor for future rewards."},
            {"key": "n_steps", "label": "N Steps", "group": "ppo", "type": "int", "default": 2048, "min": 64, "max": 8192, "step": 64, "help": "The number of steps to run for each environment per update."},
            {"key": "batch_size", "label": "Batch Size", "group": "ppo", "type": "int", "default": 64, "min": 32, "max": 2048, "step": 32, "help": "Minibatch size for each epoch."},
            {"key": "n_epochs", "label": "N Epochs", "group": "ppo", "type": "int", "default": 10, "min": 1, "max": 50, "step": 1, "help": "Number of epochs when optimizing the surrogate loss."},
            {"key": "gae_lambda", "label": "GAE Lambda", "group": "ppo", "type": "float", "default": 0.95, "min": 0.9, "max": 1.0, "step": 0.01, "help": "Factor for trade-off of bias vs variance for GAE."},
            {"key": "clip_range", "label": "Clip Range", "group": "ppo", "type": "float", "default": 0.2, "min": 0.1, "max": 0.5, "step": 0.01, "help": "Clipping parameter for PPO."},
            {"key": "ent_coef", "label": "Entropy Coefficient", "group": "loss", "type": "float", "default": 0.0, "min": 0.0, "max": 0.1, "step": 0.001, "help": "Entropy coefficient for the loss calculation."},
            {"key": "vf_coef", "label": "Value Function Coef.", "group": "loss", "type": "float", "default": 0.5, "min": 0.1, "max": 1.0, "step": 0.05, "help": "Value function coefficient for the loss calculation."}
        ]
    },
    "a2c": {
        "groups": [
            {"id": "general", "label": "General"},
            {"id": "a2c", "label": "A2C Specific"},
            {"id": "loss", "label": "Loss Coefficients"}
        ],
        "fields": [
            {"key": "learning_rate", "label": "Learning Rate", "group": "general", "type": "float", "default": 0.0007, "min": 1e-5, "max": 0.1, "step": 1e-5, "help": "The learning rate for the optimizer."},
            {"key": "gamma", "label": "Gamma (Discount Factor)", "group": "general", "type": "float", "default": 0.99, "min": 0.8, "max": 0.9999, "step": 0.001, "help": "Discount factor for future rewards."},
            {"key": "n_steps", "label": "N Steps", "group": "a2c", "type": "int", "default": 5, "min": 1, "max": 2048, "step": 1, "help": "The number of steps to run for each environment per update."},
            {"key": "gae_lambda", "label": "GAE Lambda", "group": "a2c", "type": "float", "default": 1.0, "min": 0.9, "max": 1.0, "step": 0.01, "help": "Factor for trade-off of bias vs variance for GAE. 1.0 means no GAE is used."},
            {"key": "ent_coef", "label": "Entropy Coefficient", "group": "loss", "type": "float", "default": 0.0, "min": 0.0, "max": 0.1, "step": 0.001, "help": "Entropy coefficient for the loss calculation."},
            {"key": "vf_coef", "label": "Value Function Coef.", "group": "loss", "type": "float", "default": 0.5, "min": 0.1, "max": 1.0, "step": 0.05, "help": "Value function coefficient for the loss calculation."},
            {"key": "max_grad_norm", "label": "Max Grad Norm", "group": "a2c", "type": "float", "default": 0.5, "min": 0.1, "max": 5.0, "step": 0.1, "help": "The maximum value for the gradient clipping."}
        ]
    },
    "dqn": {
        "groups": [
            {"id": "general", "label": "General"},
            {"id": "replay", "label": "Replay Buffer"},
            {"id": "exploration", "label": "Exploration"},
            {"id": "update", "label": "Update Parameters"}
        ],
        "fields": [
            {"key": "learning_rate", "label": "Learning Rate", "group": "general", "type": "float", "default": 0.0001, "min": 1e-5, "max": 0.1, "step": 1e-5, "help": "The learning rate for the optimizer."},
            {"key": "gamma", "label": "Gamma (Discount Factor)", "group": "general", "type": "float", "default": 0.99, "min": 0.8, "max": 0.9999, "step": 0.001, "help": "Discount factor for future rewards."},
            {"key": "buffer_size", "label": "Buffer Size", "group": "replay", "type": "int", "default": 1000000, "min": 10000, "max": 2000000, "step": 10000, "help": "Size of the replay buffer."},
            {"key": "learning_starts", "label": "Learning Starts", "group": "replay", "type": "int", "default": 500, "min": 300, "max": 2000, "step": 100, "help": "How many steps of experience to collect before learning starts."},
            {"key": "batch_size", "label": "Batch Size", "group": "replay", "type": "int", "default": 32, "min": 16, "max": 512, "step": 16, "help": "Minibatch size for each gradient update."},
            {"key": "exploration_fraction", "label": "Exploration Fraction", "group": "exploration", "type": "float", "default": 0.1, "min": 0.01, "max": 0.5, "step": 0.01, "help": "Fraction of entire training period over which the exploration rate is reduced."},
            {"key": "exploration_final_eps", "label": "Final Epsilon", "group": "exploration", "type": "float", "default": 0.05, "min": 0.01, "max": 0.2, "step": 0.01, "help": "Final value of random action probability."},
            {"key": "train_freq", "label": "Train Frequency", "group": "update", "type": "int", "default": 4, "min": 1, "max": 16, "step": 1, "help": "Update the model every 'train_freq' steps."},
            {"key": "gradient_steps", "label": "Gradient Steps", "group": "update", "type": "int", "default": 1, "min": -1, "max": 16, "step": 1, "help": "How many gradient steps to do after each rollout. -1 means as many as steps taken."},
            {"key": "target_update_interval", "label": "Target Update Interval", "group": "update", "type": "int", "default": 10000, "min": 500, "max": 20000, "step": 500, "help": "Update the target network every 'target_update_interval' environment steps."},
            {"key": "stats_window_size", "label": "Stats Window Size", "group": "general", "type": "int", "default": 100, "min": 1, "max": 500, "step": 1, "help": "Window size for the rollout logging, specifying the number of episodes to average."}
        ]
    },
    "sac": {
        "groups": [
            {"id": "general", "label": "General"},
            {"id": "replay", "label": "Replay Buffer"},
            {"id": "update", "label": "Update Parameters"}
        ],
        "fields": [
            {"key": "learning_rate", "label": "Learning Rate", "group": "general", "type": "float", "default": 0.0003, "min": 1e-5, "max": 0.1, "step": 1e-5, "help": "The learning rate for the optimizer."},
            {"key": "gamma", "label": "Gamma (Discount Factor)", "group": "general", "type": "float", "default": 0.99, "min": 0.8, "max": 0.9999, "step": 0.001, "help": "Discount factor for future rewards."},
            {"key": "stats_window_size", "label": "Stats Window Size", "group": "general", "type": "int", "default": 100, "min": 1, "max": 500, "step": 1, "help": "Window size for the rollout logging, specifying the number of episodes to average."},
            {"key": "buffer_size", "label": "Buffer Size", "group": "replay", "type": "int", "default": 1000000, "min": 10000, "max": 2000000, "step": 10000, "help": "Size of the replay buffer."},
            {"key": "learning_starts", "label": "Learning Starts", "group": "replay", "type": "int", "default": 500, "min": 300, "max": 2000, "step": 100, "help": "How many steps of experience to collect before learning starts."},
            {"key": "batch_size", "label": "Batch Size", "group": "replay", "type": "int", "default": 256, "min": 32, "max": 1024, "step": 32, "help": "Minibatch size for each gradient update."},
            {"key": "tau", "label": "Tau", "group": "update", "type": "float", "default": 0.005, "min": 0.001, "max": 0.1, "step": 0.001, "help": "The soft update coefficient (polyak update)."},
            {"key": "train_freq", "label": "Train Frequency", "group": "update", "type": "int", "default": 1, "min": 1, "max": 16, "step": 1, "help": "Update the model every 'train_freq' steps."},
            {"key": "gradient_steps", "label": "Gradient Steps", "group": "update", "type": "int", "default": 1, "min": -1, "max": 16, "step": 1, "help": "How many gradient steps to do after each rollout. -1 means as many as steps taken."}
        ]
    },
    "tsc": {
        "groups": [
            {"id": "general", "label": "General"},
            {"id": "replay", "label": "Replay Buffer"},
            {"id": "exploration", "label": "Exploration"},
            {"id": "update", "label": "Update Parameters"},
            {"id": "teacher", "label": "Teacher Student"}
        ],
        "fields": [
            {"key": "learning_rate", "label": "Learning Rate", "group": "general", "type": "float", "default": 0.0001, "min": 1e-5, "max": 0.1, "step": 1e-5, "help": "The learning rate for the optimizer."},
            {"key": "gamma", "label": "Gamma (Discount Factor)", "group": "general", "type": "float", "default": 0.99, "min": 0.8, "max": 0.9999, "step": 0.001, "help": "Discount factor for future rewards."},
            {"key": "stats_window_size", "label": "Stats Window Size", "group": "general", "type": "int", "default": 100, "min": 1, "max": 500, "step": 1, "help": "Window size for the rollout logging, specifying the number of episodes to average."},
            {"key": "buffer_size", "label": "Buffer Size", "group": "replay", "type": "int", "default": 1000000, "min": 10000, "max": 2000000, "step": 10000, "help": "Size of the replay buffer."},
            {"key": "learning_starts", "label": "Learning Starts", "group": "replay", "type": "int", "default": 500, "min": 300, "max": 2000, "step": 100, "help": "How many steps of experience to collect before learning starts."},
            {"key": "batch_size", "label": "Batch Size", "group": "replay", "type": "int", "default": 32, "min": 16, "max": 512, "step": 16, "help": "Minibatch size for each gradient update."},
            {"key": "exploration_fraction", "label": "Exploration Fraction", "group": "exploration", "type": "float", "default": 0.1, "min": 0.01, "max": 0.5, "step": 0.01, "help": "Fraction of entire training period over which the exploration rate is reduced."},
            {"key": "exploration_final_eps", "label": "Final Epsilon", "group": "exploration", "type": "float", "default": 0.05, "min": 0.01, "max": 0.2, "step": 0.01, "help": "Final value of random action probability."},
            {"key": "train_freq", "label": "Train Frequency", "group": "update", "type": "int", "default": 4, "min": 1, "max": 16, "step": 1, "help": "Update the model every 'train_freq' steps."},
            {"key": "gradient_steps", "label": "Gradient Steps", "group": "update", "type": "int", "default": 1, "min": -1, "max": 16, "step": 1, "help": "How many gradient steps to do after each rollout. -1 means as many as steps taken."},
            {"key": "target_update_interval", "label": "Target Update Interval", "group": "update", "type": "int", "default": 10000, "min": 500, "max": 20000, "step": 500, "help": "Update the target network every 'target_update_interval' environment steps."},
            {"key": "teacher_feedback_weight", "label": "Feedback Weight", "group": "teacher", "type": "float", "default": 0.5, "min": 0.0, "max": 2.0, "step": 0.1, "help": "Weight of the teacher's feedback in the reward shaping."},
            {"key": "teacher_warmup_episodes", "label": "Warmup Episodes", "group": "teacher", "type": "int", "default": 50, "min": 0, "max": 500, "step": 10, "help": "Number of episodes to wait before applying teacher feedback."},
            {"key": "teacher_name", "label": "Teacher Model Name", "group": "teacher", "type": "select", "required": True, "options": [], "help": "Select a pre-trained teacher model."},
            {"key": "teacher_algo", "label": "Teacher Algorithm", "group": "teacher", "type": "string", "required": False, "help": "Algorithm of the selected teacher model (auto-detected)."}
        ]
    },
    "hf-llm": {
        "groups": [
            {"id": "general", "label": "General"},
            {"id": "replay", "label": "Replay Buffer"},
            {"id": "exploration", "label": "Exploration"},
            {"id": "update", "label": "Update Parameters"},
            {"id": "llm", "label": "LLM Feedback"},
            {"id": "teacher", "label": "Teacher Student"}
        ],
        "fields": [
            {"key": "learning_rate", "label": "Learning Rate", "group": "general", "type": "float", "default": 0.0001, "min": 1e-5, "max": 0.1, "step": 1e-5, "help": "The learning rate for the optimizer."},
            {"key": "gamma", "label": "Gamma (Discount Factor)", "group": "general", "type": "float", "default": 0.99, "min": 0.8, "max": 0.9999, "step": 0.001, "help": "Discount factor for future rewards."},
            {"key": "stats_window_size", "label": "Stats Window Size", "group": "general", "type": "int", "default": 100, "min": 1, "max": 500, "step": 1, "help": "Window size for the rollout logging, specifying the number of episodes to average."},
            {"key": "buffer_size", "label": "Buffer Size", "group": "replay", "type": "int", "default": 1000000, "min": 10000, "max": 2000000, "step": 10000, "help": "Size of the replay buffer."},
            {"key": "learning_starts", "label": "Learning Starts", "group": "replay", "type": "int", "default": 500, "min": 300, "max": 2000, "step": 100, "help": "How many steps of experience to collect before learning starts."},
            {"key": "batch_size", "label": "Batch Size", "group": "replay", "type": "int", "default": 32, "min": 16, "max": 512, "step": 16, "help": "Minibatch size for each gradient update."},
            {"key": "exploration_fraction", "label": "Exploration Fraction", "group": "exploration", "type": "float", "default": 0.1, "min": 0.01, "max": 0.5, "step": 0.01, "help": "Fraction of entire training period over which the exploration rate is reduced."},
            {"key": "exploration_final_eps", "label": "Final Epsilon", "group": "exploration", "type": "float", "default": 0.05, "min": 0.01, "max": 0.2, "step": 0.01, "help": "Final value of random action probability."},
            {"key": "train_freq", "label": "Train Frequency", "group": "update", "type": "int", "default": 4, "min": 1, "max": 16, "step": 1, "help": "Update the model every 'train_freq' steps."},
            {"key": "gradient_steps", "label": "Gradient Steps", "group": "update", "type": "int", "default": 1, "min": -1, "max": 16, "step": 1, "help": "How many gradient steps to do after each rollout. -1 means as many as steps taken."},
            {"key": "target_update_interval", "label": "Target Update Interval", "group": "update", "type": "int", "default": 10000, "min": 500, "max": 20000, "step": 500, "help": "Update the target network every 'target_update_interval' environment steps."},
            {"key": "feedback_weight", "label": "Feedback Weight", "group": "llm", "type": "float", "default": 0.05, "min": 0.0, "max": 2.0, "step": 0.01, "help": "Weight of the LLM's feedback in the reward shaping."},
            {"key": "warmup_fraction", "label": "Warmup Fraction", "group": "llm", "type": "float", "default": 0.05, "min": 0.0, "max": 0.5, "step": 0.01, "help": "Fraction of total timesteps to wait before applying LLM feedback."},
            {"key": "teacher_name", "label": "Teacher Model Name", "group": "teacher", "type": "select", "required": True, "options": [], "help": "Select a pre-trained teacher model."},
            {"key": "teacher_algo", "label": "Teacher Algorithm", "group": "teacher", "type": "string", "required": False, "help": "Algorithm of the selected teacher model (auto-detected)."}
        ]
    }
}