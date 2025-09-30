import { Router, Request, Response } from 'express';
import { TrainingMetricModel } from '../models/TrainingMetric';
import { RunModel } from '../models/Run';
import mongoose from 'mongoose';
import { 
  validateId, 
  sendErrorResponse, 
  sendSuccessResponse, 
  logError, 
  logInfo 
} from '../utils/apiHelpers';

const router = Router();

// runId별로 SSE 클라이언트 관리
const runClients: { [runId: string]: Set<Response> } = {};

// 이벤트 ID 관리 (Last Event ID 지원용)
let globalEventId = 0;
const getNextEventId = () => ++globalEventId;

// 이벤트 버퍼링 (재연결 시 누락된 이벤트 전송용)
const eventBuffer: { [runId: string]: Array<{id: number, data: any, timestamp: number}> } = {};
const MAX_BUFFER_SIZE = 50; // 최근 50개 이벤트만 버퍼링

// ObjectId 유효성 검사 헬퍼 함수
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// SSE 엔드포인트 - runId별 실시간 메트릭 스트림 (Last Event ID 지원)
router.get('/api/training-metrics/stream/:runId', (req: Request, res: Response) => {
  const { runId } = req.params;
  const lastEventId = req.headers['last-event-id'] as string;

  // runId 유효성 검사
  if (!runId || !isValidObjectId(runId)) {
    return res.status(400).json({ error: 'Invalid runId format.' });
  }

  // SSE 헤더 설정 (표준 준수)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control, Last-Event-ID',
    'Access-Control-Expose-Headers': 'Last-Event-ID',
    'X-Accel-Buffering': 'no' // Nginx 버퍼링 비활성화
  });

  // 클라이언트를 runId별로 관리
  if (!runClients[runId]) {
    runClients[runId] = new Set();
  }
  runClients[runId]!.add(res);

  // 이벤트 버퍼 초기화
  if (!eventBuffer[runId]) {
    eventBuffer[runId] = [];
  }

  console.log(`SSE client connected for runId: ${runId}${lastEventId ? ` (resuming from event ${lastEventId})` : ''}`);

  // 연결 확인 메시지 전송 (ID 포함)
  const connectionEventId = getNextEventId();
  res.write(`id: ${connectionEventId}\ndata: ${JSON.stringify({ type: 'connected', runId })}\n\n`);

  // Last Event ID가 있으면 누락된 이벤트 전송
  if (lastEventId) {
    const lastId = parseInt(lastEventId);
    const bufferedEvents = eventBuffer[runId] || [];
    const missedEvents = bufferedEvents.filter(event => event.id > lastId);
    
    console.log(`Sending ${missedEvents.length} missed events for runId: ${runId}`);
    missedEvents.forEach(event => {
      res.write(`id: ${event.id}\ndata: ${JSON.stringify(event.data)}\n\n`);
    });
  }

  // 하트비트 메커니즘 (30초마다 ping 전송)
  const heartbeatInterval = setInterval(() => {
    try {
      const heartbeatId = getNextEventId();
      res.write(`id: ${heartbeatId}\ndata: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`);
    } catch (error) {
      console.error('Heartbeat error:', error);
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  // 클라이언트 연결 해제 처리
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    if (runClients[runId]) {
      runClients[runId]!.delete(res);
      console.log(`SSE client disconnected for runId: ${runId}`);
    }
  });

  req.on('error', (err) => {
    console.error('SSE connection error:', err);
    clearInterval(heartbeatInterval);
    if (runClients[runId]) {
      runClients[runId]!.delete(res);
    }
  });
});

// 단일 TrainingMetric 데이터 저장
router.post("/training-metrics", async (req, res) => {
  try {
    const { runId, phase, timesteps, metrics } = req.body;
    console.log("received metrics", req.body);
    
    // 필수 필드 검증
    if (!runId || !phase || !timesteps || !metrics || !Array.isArray(metrics)) {
      return res.status(400).json({ 
        error: 'Missing required fields: runId, phase, timesteps, metrics' 
      });
    }

    // runId 유효성 검사
    if (!isValidObjectId(runId)) {
      return res.status(400).json({ error: 'Invalid runId format.' });
    }

    // Run에서 알고리즘 정보 조회
    const run = await RunModel.findById(runId).select('algName totalSteps').lean();
    
    if (!run) {
      return res.status(404).json({ error: 'Run not found.' });
    }

    const algorithm = run.algName;

    // TrainingMetric 생성
    const trainingMetric = new TrainingMetricModel({
      runId,
      phase,
      timesteps,
      algorithm,
      rawMetrics: metrics
      // indexedMetrics, chartMetrics는 pre-save 미들웨어에서 자동 설정
    });

    // 저장
    const savedMetric = await trainingMetric.save();

    // runId별로 연결된 SSE 클라이언트에게만 실시간 알림 전송
    if (runClients[runId]) {
      // undefined 값들을 null로 변환하여 프론트엔드에서 필터링 가능하게 함
      const cleanedChartMetrics = Object.fromEntries(
        Object.entries(savedMetric.chartMetrics || {}).map(([key, value]) => [
          key, 
          value === undefined ? null : value
        ])
      );
      
      const payload = { 
        timesteps, 
        chartMetrics: cleanedChartMetrics 
      };
      const eventId = getNextEventId();
      
      // 이벤트를 버퍼에 저장 (Last Event ID 지원용)
      if (!eventBuffer[runId]) {
        eventBuffer[runId] = [];
      }
      
      eventBuffer[runId]!.push({
        id: eventId,
        data: payload,
        timestamp: Date.now()
      });
      
      // 버퍼 크기 제한 (메모리 관리)
      if (eventBuffer[runId]!.length > MAX_BUFFER_SIZE) {
        eventBuffer[runId]!.shift();
      }
      
      console.log('payload', payload);
      console.log(`📤 Sending SSE event ${eventId} to ${runClients[runId]!.size} clients for runId: ${runId}`);
      
      runClients[runId]!.forEach((res: Response) => {
        try {
          res.write(`id: ${eventId}\ndata: ${JSON.stringify(payload)}\n\n`);
        } catch (error) {
          console.error('❌ Error sending to SSE client:', error);
          // 연결이 끊어진 클라이언트 제거
          runClients[runId]!.delete(res);
        }
      });
    } else {
      console.log('❌ No SSE clients found for runId:', runId);
    }

    res.status(201).json({
      message: 'Training metric saved successfully',
      data: {
        _id: savedMetric._id,
        runId: savedMetric.runId,
        phase: savedMetric.phase,
        timesteps: savedMetric.timesteps,
        algorithm: savedMetric.algorithm,
        chartMetrics: savedMetric.chartMetrics
      }
    });

  } catch (error: any) {
    console.error('Save training metric error:', error);
    
    // 중복 키 오류 처리
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: 'Training metric for this run, phase and timestep already exists',
        details: error.keyValue
      });
    }
    
    res.status(500).json({ error: 'Failed to save training metric.' });
  }
});


export default router;