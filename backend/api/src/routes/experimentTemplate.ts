import { Router, Request, Response } from 'express';
import { ExperimentTemplateModel } from '../models/ExperimentTemplate';
import { RunModel } from '../models/Run';
import { 
  validateId, 
  sendErrorResponse, 
  sendSuccessResponse, 
  asyncHandler, 
  logError, 
  logInfo 
} from '../utils/apiHelpers';
import mongoose from 'mongoose';
import getConfigHash from '../utils/hashHelpers';

const router = Router();
const FASTAPI_BASE = process.env.FASTAPI_BASE || 'http://localhost:8000';

/**
 * 템플릿 생성
 * POST /api/experiment-templates
 */
const createTemplateHandler = async (req: Request, res: Response): Promise<void> => {
  const { name, envName, envConfig, algName, algConfig, createdBy } = req.body;
  
  if (!name || !envName || !algName) {
    sendErrorResponse(res, 400, 'name, envName, and algName are required');
    return;
  }
  
  try {
    // 중복 이름 체크
    const existingTemplate = await ExperimentTemplateModel.findOne({ name });
    if (existingTemplate) {
      sendErrorResponse(res, 409, 'Template name already exists');
      return;
    }
    
    const template = await ExperimentTemplateModel.create({ 
      name, 
      envName, 
      envConfig: envConfig || {}, 
      algName, 
      algConfig: algConfig || {}, 
      createdBy 
    });
    logInfo("Template Creation", "Template created successfully", { templateId: template._id, name });
    sendSuccessResponse(res, { templateId: template._id }, "Template created successfully");
  } catch (error) {
    logError("Create Template", error, { name });
    sendErrorResponse(res, 500, 'Failed to create template');
  }
};

/**
 * 템플릿 삭제
 * DELETE /api/experiment-templates/:id
 */
const deleteTemplateHandler = async (req: Request, res: Response): Promise<void> => {
  const templateId = validateId(req, res);
  if (!templateId) return;

  try {
    const result = await ExperimentTemplateModel.findByIdAndDelete(templateId);
    if (!result) {
      sendErrorResponse(res, 404, 'Template not found');
      return;
    }
    
    logInfo("Template Deletion", "Template deleted successfully", { templateId });
    sendSuccessResponse(res, { templateId }, "Template deleted successfully");
  } catch (error) {
    logError("Delete Template", error, { templateId });
    sendErrorResponse(res, 500, 'Failed to delete template');
  }
};

/**
 * 템플릿 목록 조회
 * GET /api/experiment-templates
 */
const getTemplatesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = await ExperimentTemplateModel
      .find({}, 'name envName algName createdAt')
      .sort({ createdAt: -1 });

    // _id를 id로 변환해서 내려주기
    const result = templates.map(t => ({
      id: t._id,
      name: t.name,
      envName: t.envName,
      algName: t.algName,
      createdAt: t.createdAt,
    }));

    logInfo("Templates List", "Successfully fetched templates list", { count: result.length });
    sendSuccessResponse(res, { templates: result });
  } catch (error) {
    logError("Get Templates", error);
    sendErrorResponse(res, 500, 'Failed to fetch templates');
  }
};

/**
 * 템플릿 상세 조회
 * GET /api/experiment-templates/:id
 */
const getTemplateHandler = async (req: Request, res: Response): Promise<void> => {
  const templateId = validateId(req, res);
  if (!templateId) return;

  try {
    const template = await ExperimentTemplateModel.findById(templateId);
    if (!template) {
      sendErrorResponse(res, 404, 'Template not found');
      return;
    }
    
    // _id를 id로 변환해서 내려주기
    const templateWithId = {
      id: template._id,
      name: template.name,
      envName: template.envName,
      envConfig: template.envConfig,
      algName: template.algName,
      algConfig: template.algConfig,
      note: template.note,
      createdBy: template.createdBy,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };

    logInfo("Template Detail", "Successfully fetched template detail", { templateId });
    sendSuccessResponse(res, { template: templateWithId });
  } catch (error) {
    logError("Get Template", error, { templateId });
    sendErrorResponse(res, 500, 'Failed to fetch template');
  }
};

/**
 * 템플릿 노트 수정
 * PATCH /api/experiment-templates/:id/note
 */
const updateTemplateNoteHandler = async (req: Request, res: Response): Promise<void> => {
  const templateId = validateId(req, res);
  if (!templateId) return;

  const { note } = req.body;

  if (note === undefined) {
    sendErrorResponse(res, 400, 'note field is required');
    return;
  }

  try {
    // 템플릿이 존재하는지 확인
    const existingTemplate = await ExperimentTemplateModel.findById(templateId);
    if (!existingTemplate) {
      sendErrorResponse(res, 404, 'Template not found');
      return;
    }

    // 노트만 업데이트
    const updatedTemplate = await ExperimentTemplateModel.findByIdAndUpdate(
      templateId,
      { $set: { note: note } },
      { new: true, runValidators: true }
    );

    logInfo("Template Note Update", "Template note updated successfully", { templateId, note });
    sendSuccessResponse(res, { template: updatedTemplate }, "Template note updated successfully");
  } catch (error) {
    logError("Update Template Note", error, { templateId, note });
    sendErrorResponse(res, 500, 'Failed to update template note');
  }
};

/**
 * 템플릿 기반 실험 실행
 * POST /api/experiment-templates/:id/runs
 */
const createTemplateRunHandler = async (req: Request, res: Response): Promise<void> => {
  const templateId = validateId(req, res);
  if (!templateId) return;

  const { totalSteps = 100000 } = req.body;

  try {
    // 템플릿 조회
    const template = await ExperimentTemplateModel.findById(templateId);
    if (!template) {
      sendErrorResponse(res, 404, 'Template not found');
      return;
    }

    const { 
      envName,
      algName,
      envConfig = {},
      algConfig = {}
    } = template;

    if (!envName || !algName) {
      sendErrorResponse(res, 400, "Template must include environment and algorithm");
      return;
    }

    const existingRuns = await RunModel.find(
      { templateId: new mongoose.Types.ObjectId(templateId) },
      { runName: 1, _id: 0 }
    ).lean();

    const templateNamePrefix = `${template.name}_run`;
    let maxNumber = 0;

    existingRuns.forEach(run => {
      if (run.runName && run.runName.startsWith(templateNamePrefix)) {
        const numberPart = run.runName.replace(templateNamePrefix, '');
        const number = parseInt(numberPart, 10);
        if (!isNaN(number) && number > maxNumber) {
          maxNumber = number;
        }
      }
    });

    // 런 이름 생성: 가장 큰 번호 + 1
    const runName = `${template.name}_run${maxNumber + 1}`;

    const configSnapshot = {
      env: {
        name: envName,
        params: Object.fromEntries(
          Object.entries(envConfig)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => {
              // 숫자로 변환 가능한 경우 숫자로, 아니면 문자열로 저장
              if (typeof v === 'number') return [k, v];
              if (typeof v === 'string' && !isNaN(Number(v))) return [k, Number(v)];
              return [k, v]; // 문자열 그대로 저장
            })
        )
      },
      algo: {
        name: algName,
        params: Object.fromEntries(
          Object.entries(algConfig)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => {
              // 숫자로 변환 가능한 경우 숫자로, 아니면 문자열로 저장
              if (typeof v === 'number') return [k, v];
              if (typeof v === 'string' && !isNaN(Number(v))) return [k, Number(v)];
              return [k, v]; // 문자열 그대로 저장
            })
        )
      },
      versions: {
        // 필요시 버전 정보 추가
      },
      artifacts: {
        modelZip: '',
        logsCsv: ''
      }
    };

    const configHash = getConfigHash(configSnapshot);

    // Run 생성
    const run = await RunModel.create({
      runName: runName,
      status: "IDLE",
      testStatus: "INVALID",
      templateId: new mongoose.Types.ObjectId(templateId),
      envName,
      algName,
      envConfig,
      algConfig,
      totalSteps: totalSteps,
      configSnapshot,
      configHash
    });

    // 상태를 RUNNING으로 업데이트
    await RunModel.updateOne(
      { _id: run._id },
      { $set: { status: "RUNNING", startTime: new Date() } }
    );

    logInfo("Template Run Creation", "Template run created successfully", { 
      runId: run._id, 
      runName, 
      templateId 
    });

    sendSuccessResponse(res, {
      runId: run._id,
      runName: runName,
      templateId: templateId,
      templateName: template.name,
      status: "RUNNING",
      totalSteps: totalSteps,
    }, "Template run created successfully");

    // FastAPI 호출
    try {
      const response = await fetch(`${FASTAPI_BASE}/experiment-templates/${run._id}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_name: runName,
          algorithm: algName.toLowerCase(),
          env_name: envName,
          total_timesteps: totalSteps,
          hyperparams: run?.configSnapshot?.algo?.params || {},
          envparams: run?.configSnapshot?.env?.params || {}
        })
      });

      if (!response.ok) {
        throw new Error(`FastAPI error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      logInfo("FastAPI Training", "FastAPI training started successfully", data);

    } catch (error) {
      logError("FastAPI Training", error, { runId: run._id });
      
      // FastAPI 호출 실패 시 상태를 FAILED로 업데이트
      await RunModel.updateOne(
        { _id: run._id },
        {
          $set: {
            status: "FAILED",
            endTime: new Date(),
            error: 'FastAPI call failed'
          } 
        }
      );
    }

  } catch (error) {
    logError("Create Template Run", error, { templateId });
    sendErrorResponse(res, 500, 'Failed to create template run');
  }
};

// ===== 라우트 정의 =====

router.post('/', asyncHandler(createTemplateHandler));
router.get('/', asyncHandler(getTemplatesHandler));
router.get('/:id', asyncHandler(getTemplateHandler));
router.patch('/:id/note', asyncHandler(updateTemplateNoteHandler));
router.delete('/:id', asyncHandler(deleteTemplateHandler));
router.post('/:id/runs', asyncHandler(createTemplateRunHandler));

export default router;