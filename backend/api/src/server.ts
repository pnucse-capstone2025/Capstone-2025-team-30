import 'dotenv/config';
import express from 'express';
import cors from "cors";
import { connectMongo } from './db/mongoose';
import { RunModel } from './models/Run';
import { logInfo, logError } from './utils/apiHelpers';

import runsRoutes from './routes/runs';
import callbacksRoutes from './routes/callbacks';
import modelsRoutes from './routes/models';
import experimentTemplateRoutes from './routes/experimentTemplate';
import algorithmRoutes from './routes/algorithms';
import environmentsRoutes from './routes/environments';
import trainingMetricsRoutes from './routes/traingMetrics';
import artifactsRoutes from './routes/artifacts';
import http from 'http';

const app = express();

// 미들 웨어
app.use(cors());
app.use(express.json());

// 프론트엔드가 사용하는 엔드포인트
app.get("/api/health", (req, res) => res.send("ok"));
app.use("/api/runs", runsRoutes);
app.use("/api/models", modelsRoutes);
app.use("/api/experiment-templates", experimentTemplateRoutes);
app.use("/api/algorithms", algorithmRoutes);
app.use("/api/environments", environmentsRoutes);
app.use("/api/artifacts", artifactsRoutes);

// FastAPI가 사용하는 엔드포인트
app.use("/", trainingMetricsRoutes);
app.use("/callbacks", callbacksRoutes);

const server = http.createServer(app);

/**
 * 서버 시작 시 실행 중인 run들을 FAILED로 변경하고, 테스트 중인 모델들을 IDLE로 변경
 * 강제 종료되었거나 비정상적으로 RUNNING 상태로 남아있는 run들을 정리합니다.
 * 테스트 중이던 모델들은 IDLE 상태로 복구합니다.
 */
const cleanupRunningAndTestingRuns = async (): Promise<void> => {
  try {
    // RUNNING 상태인 run들을 FAILED로 변경
    const runningRunsResult = await RunModel.updateMany(
      { 
        status: "RUNNING"
      },
      { 
        $set: { 
          status: "FAILED",
          testStatus: "INVALID",
          endTime: new Date(),
          error: "Server restart - run was forcefully terminated"
        } 
      }
    );

    // TESTING 상태인 모델들을 IDLE로 변경 (status가 RUNNING이 아닌 경우)
    const testingModelsResult = await RunModel.updateMany(
      { 
        status: { $ne: "RUNNING" },
        testStatus: { $in: ["TESTING", "PAUSED"] }
      },
      { 
        $set: { 
          testStatus: "IDLE"
        } 
      }
    );

    if (runningRunsResult.modifiedCount > 0) {
      logInfo("Server Startup", `Cleaned up ${runningRunsResult.modifiedCount} running runs`, {
        modifiedCount: runningRunsResult.modifiedCount
      });
    }

    if (testingModelsResult.modifiedCount > 0) {
      logInfo("Server Startup", `Reset ${testingModelsResult.modifiedCount} testing models to IDLE`, {
        modifiedCount: testingModelsResult.modifiedCount
      });
    }

    if (runningRunsResult.modifiedCount === 0 && testingModelsResult.modifiedCount === 0) {
      logInfo("Server Startup", "No running runs or testing models found to cleanup");
    }
  } catch (error) {
    logError("Server Startup", error, { message: "Failed to cleanup running runs and testing models" });
  }
};

const port = Number(process.env.PORT || 8080);
connectMongo().then(async () => {
  // 서버 시작 시 실행 중인 run들 정리
  await cleanupRunningAndTestingRuns();
  
  server.listen(port, () => console.log(`API & SSE server running on :${port}`));
});