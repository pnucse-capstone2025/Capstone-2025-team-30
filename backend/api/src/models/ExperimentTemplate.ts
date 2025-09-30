import { Schema, model, Types } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const ExperimentTemplateSchema = new Schema({
  name: { type: String, required: true, index: true },
  note: { type: String, default: "자유롭게 노트를 작성해 보세요." },
  envName: { type: String, required: true },
  envConfig: { type: Schema.Types.Mixed, required: true },
  algName: { type: String, required: true },
  algConfig: { type: Schema.Types.Mixed, required: true },
  createdBy: { type: String, default: "" },
}, { timestamps: true });

export type ExperimentTemplateDoc = InferSchemaType<typeof ExperimentTemplateSchema>;
export const ExperimentTemplateModel = model("ExperimentTemplate", ExperimentTemplateSchema, "experiment_templates");