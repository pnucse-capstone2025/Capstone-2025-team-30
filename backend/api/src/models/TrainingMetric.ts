import { Schema, model, Types } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const TrainingMetricSchema = new Schema({
  runId: { type: Types.ObjectId, index: true, required: true },
  
  // 기본 정보
  phase: { type: String, enum: ["rollout", "step"], required: true },
  timesteps: { type: Number, required: true, index: true },
  algorithm: { type: String, enum: ["dqn", "ppo", "tsc", "sac", "hf-llm"], required: true },
  
  // 원본 데이터 (간소화된 형태로 보관)
  rawMetrics: [{ 
    name: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    group: { type: String, enum: ["train", "rollout", "time", "custom", "teacher"], required: true },
    _id: false
  }],
  
  // 빠른 조회용 인덱싱된 데이터
  indexedMetrics: {
    rollout: { type: Schema.Types.Mixed, default: {} },
    train: { type: Schema.Types.Mixed, default: {} },
    time: { type: Schema.Types.Mixed, default: {} },
    custom: { type: Schema.Types.Mixed, default: {} },
    teacher: { type: Schema.Types.Mixed, default: {} }
  },
  
  // 실시간 차트용 표준화된 핵심 지표
  chartMetrics: {
    reward: { type: Number },      // ep_rew_mean 또는 ep_reward_mean
    loss: { type: Number },        // train.loss
    exploration: { type: Number }, // entropy_loss 또는 exploration_rate
    efficiency: { type: Number }   // ep_len_mean 또는 ep_length_mean
  }
  
}, { timestamps: true });

// 인덱스 최적화
TrainingMetricSchema.index({ runId: 1, phase: 1, timesteps: 1 }, { unique: true });
TrainingMetricSchema.index({ runId: 1, timesteps: 1 });
TrainingMetricSchema.index({ algorithm: 1, timesteps: 1 });

// 메트릭 데이터 표준화 헬퍼 함수
TrainingMetricSchema.statics.standardizeMetrics = function(rawMetrics: any[], algorithm: string) {
  const indexed = rawMetrics.reduce((acc: any, metric: any) => {
    if (!acc[metric.group]) acc[metric.group] = {};
    acc[metric.group][metric.name] = metric.value;
    return acc;
  }, { rollout: {}, train: {}, time: {}, custom: {}, teacher: {} });
  
  const chartMetrics: any = {};
  
  // 성능 지표 (공통)
  chartMetrics.reward = indexed.rollout.ep_rew_mean;
  
  // 손실 지표 (공통)
  chartMetrics.loss = indexed.train.loss;
  
  // 탐험 지표 (알고리즘별)
  if (algorithm === "ppo") {
    chartMetrics.exploration = indexed.train.entropy_loss ? -indexed.train.entropy_loss : null;
  } else if (algorithm === "dqn" || algorithm === "tsc" || algorithm === "hf-llm") {
    chartMetrics.exploration = indexed.rollout.exploration_rate;
  }
  
  // 효율성 지표 (공통)
  chartMetrics.efficiency = indexed.rollout.ep_len_mean;
  
  return { indexedMetrics: indexed, chartMetrics };
};

// 데이터 저장 전 처리 미들웨어
TrainingMetricSchema.pre('save', function() {
  if (this.rawMetrics && this.rawMetrics.length > 0 && this.algorithm) {
    // 메트릭 표준화 (algorithm은 이미 설정된 상태)
    const standardized = (this.constructor as any).standardizeMetrics(this.rawMetrics, this.algorithm);
    this.indexedMetrics = standardized.indexedMetrics;
    this.chartMetrics = standardized.chartMetrics;
  }
});

export type TrainingMetricDoc = InferSchemaType<typeof TrainingMetricSchema>;
export const TrainingMetricModel = model("TrainingMetric", TrainingMetricSchema, "training_metrics");