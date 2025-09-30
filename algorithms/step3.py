"""
Step 3: BC + Human Feedback(GPT API)

주요 특징:
- BC로 초기화된 Student 네트워크에 실시간 Human 피드백 적용
- 웹 브라우저 기반 실시간 스트리밍 및 피드백 입력 UI
- GPT API를 통한 자연어 피드백의 0-1 점수 변환 (코사인 거리 방식 없음)
- 차별화된 학습률: CNN(5e-6), FC(2e-5)
- 일시정지/재개 기능으로 사용자 편의성 향상
- FastAPI 서버 + OpenCV 고해상도 시각화
- 동적 cnt 전략: 긍정(4→1), 중립(1), 부정(3→1)
"""
import os, random, time, threading, queue

# .env 파일 로드
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=".env")  # 현재 디렉토리의 .env 파일
    print(" .env 파일 로드 완료")
except ImportError:
    print(" python-dotenv not installed, using system env vars only")

from typing import Optional, List
import gymnasium as gym
import numpy as np
import cv2
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
import torchvision.transforms as T
from torch.utils.tensorboard import SummaryWriter
from collections import namedtuple, deque

# ────────────────────────────────────────────────────────────────────────────────
# 설정 및 실험 구성
# ────────────────────────────────────────────────────────────────────────────────
SEED              = 42
WARMUP_EPISODES   = 50
NUM_EPISODES      = 1000
MAX_STEPS         = 1000
BATCH_SIZE        = 128
GAMMA             = 0.99
TARGET_UPDATE     = 1000
MEMORY_CAPACITY   = 100_000
FEEDBACK_WEIGHT   = 0.3
CNN_LR            = 5e-6
RESIZE            = (84, 84)

# 디스플레이
DISPLAY_SCALE = 6                 
DISPLAY_WIN   = "CarRacing"
DISPLAY_FPS   = 60
HUD_ALPHA_BG  = 0.45
# 서버에서 브라우저로만 볼 거면 True
HEADLESS      = True               
# 액션 컨텍스트를 GPT 프롬프트에 넣기 위한 최신 액션 저장
last_action_for_prompt = "—"
# True로 두면 GPT에 보낸 프롬프트를 콘솔에 찍음
LOG_PROMPT = False  
# GPT/서버
# 원격 접속용. 로컬만이면 "127.0.0.1"
SERVER_HOST   = "127.0.0.1"         
SERVER_PORT   = 17890
OPENAI_MODEL  = "gpt-4o-mini"


EXPERIMENT_TYPE = "lower_fc_lr" 

FC_LR_CONFIGS = {
    "lower_fc_lr": 2e-5,
}

# ────────────────────────────────────────────────────────────────────────────────
# 재현성을 위한 SEED설정 및 디바이스 설정
# ────────────────────────────────────────────────────────────────────────────────
random.seed(SEED); np.random.seed(SEED); torch.manual_seed(SEED)
if torch.cuda.is_available(): torch.cuda.manual_seed_all(SEED)
torch.backends.cudnn.benchmark = False

if torch.backends.mps.is_available():
    device = torch.device("mps")
elif torch.cuda.is_available():
    device = torch.device("cuda")
else:
    device = torch.device("cpu")
print(f" Using device: {device}")

# ────────────────────────────────────────────────────────────────────────────────
# 환경 래퍼
# ────────────────────────────────────────────────────────────────────────────────
class CarRacingDiscrete(gym.Wrapper):
    ACTIONS = [
        np.array([-1.0, 0.0, 0.0], np.float32),  
        np.array([ 1.0, 0.0, 0.0], np.float32),  
        np.array([ 0.0, 1.0, 0.0], np.float32),  
        np.array([ 0.0, 0.0, 0.8], np.float32),  
        np.array([-1.0, 1.0, 0.0], np.float32),  
        np.array([ 1.0, 1.0, 0.0], np.float32),  
        np.array([ 0.0, 0.0, 0.0], np.float32),  
    ]
    ACTION_NAMES = ["Left","Right","Accel","Brake","Left+Accel","Right+Accel","No-Op"]

    def __init__(self, resize=RESIZE):
        env = gym.make("CarRacing-v3", render_mode="rgb_array")
        super().__init__(env)
        self.action_space      = gym.spaces.Discrete(len(self.ACTIONS))
        self.observation_space = gym.spaces.Box(0,255,(resize[0],resize[1],1),dtype=np.uint8)
        self.tf = T.Compose([
            T.ToPILImage(),
            T.Grayscale(1),
            T.Resize(resize, T.InterpolationMode.BILINEAR),
            T.ToTensor(),
        ])
        self.last_rgb = None

    def _proc(self, frame):
        x = self.tf(frame).squeeze(0)
        return (x*255).byte().numpy()

    def step(self, a):
        obs, r, term, trunc, info = self.env.step(self.ACTIONS[a])
        self.last_rgb = obs
        return self._proc(obs), r, term, trunc, info

    def reset(self, **kw):
        obs, info = self.env.reset(**kw)
        self.last_rgb = obs
        return self._proc(obs), info

# ────────────────────────────────────────────────────────────────────────────────
# FrameStack
# ────────────────────────────────────────────────────────────────────────────────
class FrameStack:
    def __init__(self, k): self.k, self.buf = k, deque([], maxlen=k)
    def reset(self, obs):
        for _ in range(self.k): self.buf.append(obs)
        return np.stack(self.buf, 0)
    def step(self, obs):
        self.buf.append(obs)
        return np.stack(self.buf, 0)

# ────────────────────────────────────────────────────────────────────────────────
# DQN 네트워크
# ────────────────────────────────────────────────────────────────────────────────
class DQN(nn.Module):
    def __init__(self, h, w, outputs):
        super().__init__()
        self.conv1 = nn.Conv2d(4,32,8,4)
        self.conv2 = nn.Conv2d(32,64,4,2)
        self.conv3 = nn.Conv2d(64,64,3,1)
        def co(o,k,s): return (o-(k-1)-1)//s+1
        cw = co(co(co(w,8,4),4,2),3,1)
        ch = co(co(co(h,8,4),4,2),3,1)
        lin = cw*ch*64
        self.fc   = nn.Linear(lin,512)
        self.head = nn.Linear(512,outputs)
    def forward(self, x):
        x = x/255.0
        x = F.relu(self.conv1(x))
        x = F.relu(self.conv2(x))
        x = F.relu(self.conv3(x))
        x = torch.flatten(x,1)
        x = F.relu(self.fc(x))
        return self.head(x)

# ────────────────────────────────────────────────────────────────────────────────
# ReplayMemory - transition에 'feedback'에 cnt 추가
# ────────────────────────────────────────────────────────────────────────────────
Transition = namedtuple('Transition',
    ('state','action','next_state','reward','time','feedback'),
    defaults=[0,0]
)
class ReplayMemory:
    def __init__(self, cap): self.mem = deque([], maxlen=cap)
    def push(self, *args, cnt=1):
        tr = Transition(*args)
        for _ in range(cnt): self.mem.append(tr)
    def sample(self, b): return random.sample(self.mem, b)
    def __len__(self): return len(self.mem)

# ────────────────────────────────────────────────────────────────────────────────
# 보조 함수들
# to_feedback: 피드백 임계값을 통해 긍정/중립/부정 분류
# cnt_for_fb: 동적인 리플레이 메모리 삽입 전략
# epsilon_schedule: default 0.05,warmup 이후 0.08
# create_fc_lr_optimizer: CNN(5e-6), FC(2e-5)
# ────────────────────────────────────────────────────────────────────────────────
def to_feedback(dist):
    if dist <= 0.1:     return  1
    elif dist <= 0.4:   return  0
    else:               return -1

def cnt_for_fb(fb, ep, tot_remaining_episodes):
    if tot_remaining_episodes <= 0:
        return 1
    progress = min(1.0, ep / tot_remaining_episodes)
    if fb == 1:
        base_cnt = 4
        return max(1, int(base_cnt * (1 - progress * 0.5)))
    elif fb == 0:
        return 1
    else:
        base_cnt = 3
        return max(1, int(base_cnt * (1 - progress * 0.3)))

def epsilon_schedule(ep):
    return 0.05 if ep <= WARMUP_EPISODES else 0.08

def create_fc_lr_optimizer(model, experiment_type):
    cnn_params, fc_params = [], []
    for name, p in model.named_parameters():
        (cnn_params if any(k in name for k in ['conv1','conv2','conv3']) else fc_params).append(p)
    fc_lr = FC_LR_CONFIGS[experiment_type]
    print(f" FC-LR Experiment: {experiment_type}")
    print(f"   CNN params: {sum(p.numel() for p in cnn_params):,} (LR: {CNN_LR:.2e}) [FIXED]")
    print(f"   FC params: {sum(p.numel() for p in fc_params):,} (LR: {fc_lr:.2e}) [VARIABLE]")
    print(f"   FC/CNN LR Ratio: {fc_lr/CNN_LR:.1f}x")

    return optim.RMSprop([
        {'params': cnn_params, 'lr': CNN_LR},
        {'params': fc_params, 'lr': fc_lr}])

# ────────────────────────────────────────────────────────────────────────────────
#  화면 표시
# ────────────────────────────────────────────────────────────────────────────────
def _ensure_win(win_name: str):
    if HEADLESS: return
    if not hasattr(_ensure_win, "_inited"):
        cv2.namedWindow(win_name, cv2.WINDOW_NORMAL)
        _ensure_win._inited = True

def draw_overlay(bgr: np.ndarray, lines: List[str]):
    if not lines: return
    pad = 8 * DISPLAY_SCALE // 4
    line_h = 22 * DISPLAY_SCALE // 4
    box_w = max(240, max([cv2.getTextSize(s, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0][0] for s in lines]) + 2*pad)
    box_h = pad*2 + line_h*len(lines)
    overlay = bgr.copy()
    cv2.rectangle(overlay, (8,8), (8+box_w, 8+box_h), (0,0,0), -1)
    cv2.addWeighted(overlay, HUD_ALPHA_BG, bgr, 1-HUD_ALPHA_BG, 0, bgr)
    y = 8 + pad + line_h - 6
    for s in lines:
        cv2.putText(bgr, s, (12, y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2, cv2.LINE_AA)
        y += line_h

def show_frame(rgb: Optional[np.ndarray], overlay_lines: Optional[List[str]] = None, win_name: str = DISPLAY_WIN):
    if HEADLESS or rgb is None: return
    _ensure_win(win_name)
    h, w = rgb.shape[:2]
    scaled = cv2.resize(rgb, (w*DISPLAY_SCALE, h*DISPLAY_SCALE), interpolation=cv2.INTER_NEAREST)
    bgr = cv2.cvtColor(scaled, cv2.COLOR_RGB2BGR)
    if overlay_lines: draw_overlay(bgr, overlay_lines)
    cv2.resizeWindow(win_name, bgr.shape[1], bgr.shape[0])
    cv2.imshow(win_name, bgr)
    cv2.waitKey(max(1, int(1000/ DISPLAY_FPS)))

# ────────────────────────────────────────────────────────────────────────────────
#  FastAPI (스트림/일시정지/피드백) + GPT 점수화
# ────────────────────────────────────────────────────────────────────────────────
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel
try:
    from openai import OpenAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    gpt_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
except Exception as e:
    print("[WARN] OpenAI SDK 초기화 실패:", e); gpt_client = None

_feedback_q: "queue.Queue[float]" = queue.Queue()
pause_event = threading.Event()

# ────────────────────────────────────────────────────────────────────────────────
# 프롬프트
# ────────────────────────────────────────────────────────────────────────────────
# 사용자 텍스트와 현재 액션을 포함해, 0과 1 사이의 점수만 반환하도록 지시하는 프롬프트.
# 0=매우 긍정(좋은/올바른 행동), 1=매우 부정(위험/잘못).
# ────────────────────────────────────────────────────────────────────────────────

def build_feedback_prompt(user_text, action_name):
    return f"""You are scoring human feedback for a car-racing RL agent.

Current AI action: {action_name}
Human feedback: \"\"\"{user_text.strip()}\"\"\"

Score the NEGATIVITY of this action on a continuous scale [0.0, 1.0].
Guidelines:
- 0.0 → very positive or clearly correct (good line, smooth, on-track, appropriate speed)
- 0.1~0.3 → somewhat positive
- 0.4~0.6 → neutral/unclear
- 0.7~0.9 → somewhat negative (too fast, late brake, off racing line, over/understeer)
- 1.0 → very negative or dangerous (off track, crash, wrong direction)

Return ONLY a single float number in [0,1] with no extra text.
Examples (not about this exact situation):
- "good job staying on track" → 0.05
- "ok but a little wide" → 0.35
- "late brake, almost off" → 0.8
- "dangerous, wrong way" → 1.0
"""
# ────────────────────────────────────────────────────────────────────────────────
# gpt_score
# ────────────────────────────────────────────────────────────────────────────────
# 텍스트 -> 0과 1 사이의 점수 (0=좋음, 1=나쁨). 실패/미설치 시 0.25.
# GPT 호출(프롬프트 빌더 사용).
# ────────────────────────────────────────────────────────────────────────────────

def gpt_score(text, action_name):

    if not gpt_client:
        return 0.25

    try:
        prompt = build_feedback_prompt(text, action_name)
        if LOG_PROMPT:
            print("\n[GPT PROMPT]\n", prompt)

        resp = gpt_client.chat.completions.create(
            model=OPENAI_MODEL,
            temperature=0,
            max_tokens=8,
            messages=[
                {"role":"system","content":"You output only a float in [0,1]."},
                {"role":"user","content": prompt}
            ],
        )
        s = float(resp.choices[0].message.content.strip())
        return max(0.0, min(1.0, s))
    except Exception as e:
        print("[GPT] fail -> 0.25:", e)
        return 0.25

def _rgb_to_jpeg(rgb):
    if rgb is None: return None
    h, w = rgb.shape[:2]
    scaled = cv2.resize(rgb, (w*DISPLAY_SCALE, h*DISPLAY_SCALE), interpolation=cv2.INTER_NEAREST)
    bgr = cv2.cvtColor(scaled, cv2.COLOR_RGB2BGR)
    ok, jpg = cv2.imencode(".jpg", bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    return jpg.tobytes() if ok else None

def mjpeg_gen():
    while True:
        frame = _rgb_to_jpeg(getattr(env, "last_rgb", None))
        if frame is not None:
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")
        time.sleep(1.0 / max(1, DISPLAY_FPS))

def start_feedback_server():
    app = FastAPI()
    class In(BaseModel):
        text: str

    @app.get("/", response_class=HTMLResponse)
    def ui():
        return f"""
<!doctype html><html><head><meta charset="utf-8"><title>RL Feedback</title></head>
<body style="font-family:system-ui; padding:16px;">
  <h2>CarRacing Feedback</h2>
  <div style="display:flex; gap:20px; align-items:flex-start;">
    <!-- 왼쪽: 비디오 스트림 -->
    <div style="flex:1;">
      <p>아래 영상은 서버에서 전송되는 스트림입니다.</p>
      <img id="cam" src="/stream" style="max-width:720px; border:1px solid #ccc; display:block;">
    </div>
    
    <!-- 오른쪽: 피드백 입력 -->
    <div style="flex:0 0 400px; background:#f9f9f9; padding:16px; border-radius:8px;">
      <h3 style="margin-top:0;">피드백 입력</h3>
      <button onclick="pause()" style="width:100%; padding:10px; margin-bottom:12px; background:#007acc; color:white; border:none; border-radius:4px; cursor:pointer;">⏸ Pause & Give Feedback</button>
      <textarea id="t" rows="6" style="width:100%; box-sizing:border-box; margin-bottom:8px; padding:8px; border:1px solid #ddd; border-radius:4px;" placeholder="예) 코너 진입 전에 감속해요, 우회전 과함"></textarea>
      <button onclick="send()" style="width:100%; padding:10px; background:#28a745; color:white; border:none; border-radius:4px; cursor:pointer;">피드백 보내기</button>
      <pre id="log" style="background:#fff; padding:8px; margin-top:12px; border:1px solid #ddd; border-radius:4px; white-space:pre-wrap; word-wrap:break-word;"></pre>
    </div>
  </div>
<script>
async function pause(){{ await fetch('/pause', {{method:'POST'}}); document.getElementById('log').textContent='Paused. Type feedback and press [피드백 보내기].'; }}
async function send(){{ const text=document.getElementById('t').value; const res=await fetch('/feedback', {{method:'POST', headers:{{'Content-Type':'application/json'}}, body: JSON.stringify({{text}})}}); const data=await res.json(); document.getElementById('log').textContent='score: '+data.score+' (queued) — training will resume'; }}
</script>
</body></html>
        """

    @app.get("/stream")
    def stream():
        return StreamingResponse(mjpeg_gen(), media_type="multipart/x-mixed-replace; boundary=frame")

    @app.post("/pause")
    def pause_req():
        pause_event.set(); return {"ok": True}

    @app.post("/feedback")
    def post(i: In):
        # 최신 액션명을 프롬프트에 함께 넣어 점수화
        s = gpt_score(i.text or "", last_action_for_prompt)
        _feedback_q.put(s)
        return {"ok": True, "score": s}

    import uvicorn
    uvicorn.run(app, host=SERVER_HOST, port=SERVER_PORT, log_level="warning")

# 서버 스레드 기동
threading.Thread(target=start_feedback_server, daemon=True).start()

def pop_latest_feedback() -> Optional[float]:
    latest = None
    try:
        while True: latest = _feedback_q.get_nowait()
    except queue.Empty:
        pass
    return latest
# ────────────────────────────────────────────────────────────────────────────────
# 일시정지 후 텍스트 제출까지 대기. 최신 점수 하나 반환.
# ────────────────────────────────────────────────────────────────────────────────
def wait_for_feedback_blocking(overlay_lines):
    score = None
    while True:
        show_frame(getattr(env, "last_rgb", None), overlay_lines)
        try:
            score = _feedback_q.get(timeout=0.1)
            return score
        except queue.Empty:
            if not pause_event.is_set(): return None
            continue

# ────────────────────────────────────────────────────────────────────────────────
# 초기화
# ────────────────────────────────────────────────────────────────────────────────
env         = CarRacingDiscrete()
frame_stack = FrameStack(4)

student_net = DQN(*RESIZE, env.action_space.n).to(device)
target_net  = DQN(*RESIZE, env.action_space.n).to(device)

# BC 파라미터

bcpt = torch.load("student_final_improved_cosin.pth", map_location=device)
student_net.load_state_dict(bcpt); target_net.load_state_dict(bcpt)
print(" Loaded pretrained weights")

target_net.eval()
optimizer = create_fc_lr_optimizer(student_net, EXPERIMENT_TYPE)
from torch.optim.lr_scheduler import CosineAnnealingLR
scheduler = CosineAnnealingLR(optimizer, T_max=NUM_EPISODES, eta_min=1e-6)

memory      = ReplayMemory(MEMORY_CAPACITY)
writer      = SummaryWriter(log_dir=f"runs/hf_fc_lr_{EXPERIMENT_TYPE}_{int(time.time())}")

steps_done  = 0
feedback_stats = {'positive': 0, 'neutral': 0, 'negative': 0}
distance_history = []

# ────────────────────────────────────────────────────────────────────────────────
# optimize_model
# ────────────────────────────────────────────────────────────────────────────────
def optimize_model():
    if len(memory) < BATCH_SIZE: return None

    batch = Transition(*zip(*memory.sample(BATCH_SIZE)))
    non_mask = torch.tensor([s is not None for s in batch.next_state], device=device, dtype=torch.bool)
    non_next = torch.cat([s for s in batch.next_state if s is not None]) if non_mask.any() else torch.empty(0, device=device)

    S  = torch.cat(batch.state).to(device)             # [B,4,H,W]
    A  = torch.cat(batch.action).to(device)            # [B,1]
    R  = torch.cat(batch.reward).to(device)            # [B,1]
    FB = torch.tensor(batch.feedback, device=device, dtype=torch.float32).view(-1,1)  # [B,1]

    total_r = R + FEEDBACK_WEIGHT * FB                 # [B,1]
    Qsa = student_net(S).gather(1, A)                  # [B,1]

    with torch.no_grad():
        next_v = torch.zeros(BATCH_SIZE, device=device)
        if non_next.numel() > 0:
            next_v[non_mask] = target_net(non_next).max(1)[0]

    target = next_v.view(-1,1) * GAMMA + total_r       # [B,1]
    loss = F.smooth_l1_loss(Qsa, target)

    optimizer.zero_grad(); loss.backward()
    torch.nn.utils.clip_grad_value_(student_net.parameters(), 1)
    optimizer.step()
    return loss.item()

# ────────────────────────────────────────────────────────────────────────────────
# 학습 루프
# ────────────────────────────────────────────────────────────────────────────────
print(f" Training start. Open http://127.0.0.1:{SERVER_PORT}")

reward_hist, loss_hist = [], []

for ep in range(1, NUM_EPISODES+1):
    current_lrs = scheduler.get_last_lr()
    current_cnn_lr, current_fc_lr = current_lrs[0], current_lrs[1]

    obs,_  = env.reset(seed=SEED+ep)
    state  = torch.from_numpy(frame_stack.reset(obs)).unsqueeze(0).to(device).float()
    ep_r, ep_losses = 0.0, []

    ep_feedback_stats = {'positive': 0, 'neutral': 0, 'negative': 0}
    ep_distances = []
    last_fb_txt = "—"; last_dist = None; last_act = "—"

    for t in range(MAX_STEPS):
        eps = epsilon_schedule(ep)
        if random.random() > eps:
            with torch.no_grad(): act = student_net(state).argmax(1).view(1,1)
        else:
            act = torch.tensor([[random.randrange(env.action_space.n)]], device=device)
        steps_done += 1
        last_act = env.ACTION_NAMES[act.item()]
        last_action_for_prompt = last_act
        # 블로킹/비차단 피드백
        if ep > WARMUP_EPISODES:
            if pause_event.is_set():
                overlay_lines = [
                    f"Ep {ep}/{NUM_EPISODES}  Step {t+1}/{MAX_STEPS}",
                    f"Action: {env.ACTION_NAMES[act.item()]}   eps {eps:.2f}",
                    f"LR(CNN/FC): {current_cnn_lr:.1e} / {current_fc_lr:.1e}",
                    "⏸ WAITING FOR FEEDBACK ... (submit in browser)"
                ]
                dist = wait_for_feedback_blocking(overlay_lines)   # 0~1 (blocking)
                if dist is not None:
                    fb = to_feedback(dist)
                    if fb == 1: ep_feedback_stats['positive']+=1; feedback_stats['positive']+=1; last_fb_txt="+1 (≤0.1)"
                    elif fb == 0: ep_feedback_stats['neutral']+=1;  feedback_stats['neutral']+=1;  last_fb_txt="0 (≤0.4)"
                    else:         ep_feedback_stats['negative']+=1; feedback_stats['negative']+=1; last_fb_txt="-1 (>0.4)"
                    cnt = cnt_for_fb(fb, ep - WARMUP_EPISODES, NUM_EPISODES - WARMUP_EPISODES)
                    ep_distances.append(dist); last_dist = dist
                else:
                    fb, cnt, last_dist, last_fb_txt = 0, 1, None, "—"
                pause_event.clear()
            else:
                dist = pop_latest_feedback()
                if dist is not None:
                    fb = to_feedback(dist)
                    if fb == 1: ep_feedback_stats['positive']+=1; feedback_stats['positive']+=1; last_fb_txt="+1 (≤0.1)"
                    elif fb == 0: ep_feedback_stats['neutral']+=1;  feedback_stats['neutral']+=1;  last_fb_txt="0 (≤0.4)"
                    else:         ep_feedback_stats['negative']+=1; feedback_stats['negative']+=1; last_fb_txt="-1 (>0.4)"
                    cnt = cnt_for_fb(fb, ep - WARMUP_EPISODES, NUM_EPISODES - WARMUP_EPISODES)
                    ep_distances.append(dist); last_dist = dist
                else:
                    fb, cnt, last_dist, last_fb_txt = 0, 1, None, "—"
        else:
            fb, cnt, last_dist, last_fb_txt = 0, 1, None, "—"

        # 화면(항상 표시)
        overlay_lines = [
            f"Ep {ep}/{NUM_EPISODES}  Step {t+1}/{MAX_STEPS}",
            f"Action: {last_act}   eps {eps:.2f}",
            f"LR(CNN/FC): {current_cnn_lr:.1e} / {current_fc_lr:.1e}",
            f"FB(last): {last_fb_txt}   dist: {('-' if last_dist is None else f'{last_dist:.3f}')}"
        ]
        show_frame(env.last_rgb, overlay_lines)

        # 환경 스텝
        obs,r,term,trunc,_ = env.step(act.item())
        ep_r += r
        rt = torch.tensor([[r]], device=device)

        next_state = None
        if not (term or trunc):
            ns_np = frame_stack.step(obs)
            next_state = torch.from_numpy(ns_np).unsqueeze(0).to(device).float()

        # 메모리 저장
        memory.push(state, act, next_state, rt, time.time(), fb, cnt=cnt)
        state = next_state if next_state is not None else state

        # 학습
        l = optimize_model()
        if l is not None: ep_losses.append(l)

        # 타겟 네트워크
        if steps_done % TARGET_UPDATE == 0:
            target_net.load_state_dict(student_net.state_dict())

        if term or trunc: break

    reward_hist.append(ep_r)
    loss_hist.append(np.mean(ep_losses) if ep_losses else 0.0)

    # 로그
    writer.add_scalar("Episode/Reward", ep_r, ep)
    writer.add_scalar("Episode/Loss", np.mean(ep_losses) if ep_losses else 0.0, ep)
    writer.add_scalar("LearningRate/CNN_LR", current_cnn_lr, ep)
    writer.add_scalar("LearningRate/FC_LR", current_fc_lr, ep)
    writer.add_scalar("LearningRate/FC_CNN_Ratio", current_fc_lr/current_cnn_lr, ep)
    writer.add_scalar("Episode/Epsilon", eps, ep)
    writer.add_scalar("Episode/Steps", t+1, ep)
    phase = "Pre_Feedback_Warmup" if ep <= WARMUP_EPISODES else f"With_Human_{EXPERIMENT_TYPE}"
    writer.add_scalar("Training/Phase", 1 if ep <= WARMUP_EPISODES else 2, ep)

    if ep > WARMUP_EPISODES:
        writer.add_scalar("Feedback/Positive_Count", ep_feedback_stats['positive'], ep)
        writer.add_scalar("Feedback/Neutral_Count",  ep_feedback_stats['neutral'],  ep)
        writer.add_scalar("Feedback/Negative_Count", ep_feedback_stats['negative'], ep)
        if ep_distances:
            avg_distance = np.mean(ep_distances)
            writer.add_scalar("Feedback/Average_Distance", avg_distance, ep)
            distance_history.extend(ep_distances)
        total_fb = sum(ep_feedback_stats.values())
        if total_fb > 0:
            writer.add_scalar("Feedback/Positive_Ratio", ep_feedback_stats['positive']/total_fb, ep)
            writer.add_scalar("Feedback/Negative_Ratio", ep_feedback_stats['negative']/total_fb, ep)

    scheduler.step()

    fc_cnn_ratio = current_fc_lr / current_cnn_lr if current_cnn_lr > 0 else float('inf')
    if ep > WARMUP_EPISODES and ep_distances:
        avg_dist = np.mean(ep_distances)
        print(f"Ep {ep:4d} | Reward {ep_r:7.1f} | Loss {np.mean(ep_losses):7.4f} | FB Dist:{avg_dist:.3f} "
              f"| [{phase}] | ε:{eps:.3f} | FC/CNN:{fc_cnn_ratio:.1f}x | LR:{current_cnn_lr:.1e}/{current_fc_lr:.1e}")
    else:
        print(f"Ep {ep:4d} | Reward {ep_r:7.1f} | Loss {np.mean(ep_losses):7.4f} "
              f"| [{phase}] | ε:{eps:.3f} | FC/CNN:{fc_cnn_ratio:.1f}x | LR:{current_cnn_lr:.1e}/{current_fc_lr:.1e}")

# ────────────────────────────────────────────────────────────────────────────────
#  저장/마무리
# ────────────────────────────────────────────────────────────────────────────────
print("\n Training completed!")
if distance_history:
    print(f"   Average GPT score: {np.mean(distance_history):.4f}  "
          f"std: {np.std(distance_history):.4f}  "
          f"min/max: {np.min(distance_history):.4f}/{np.max(distance_history):.4f}")
total_feedback = sum(feedback_stats.values())
if total_feedback > 0:
    print(f"   Feedback events: {total_feedback}  +:{feedback_stats['positive']}  0:{feedback_stats['neutral']}  -:{feedback_stats['negative']}")

final_save = {
    'student_net': student_net.state_dict(),
    'target_net': target_net.state_dict(),
    'optimizer': optimizer.state_dict(),
    'hyperparameters': {
        'EXPERIMENT_TYPE': EXPERIMENT_TYPE,
        'WARMUP_EPISODES': WARMUP_EPISODES,
        'FEEDBACK_WEIGHT': FEEDBACK_WEIGHT,
        'CNN_LR': CNN_LR,
        'FC_LR_CONFIG': FC_LR_CONFIGS[EXPERIMENT_TYPE],
        'BATCH_SIZE': BATCH_SIZE,
        'EPSILON_SCHEDULE': 'Fixed (0.05 → 0.08)',
        'LEARNING_STRATEGY': f'Human Feedback + FC-LR: {EXPERIMENT_TYPE}',
        'GPT_UI_PORT': SERVER_PORT,
        'DISPLAY_SCALE': DISPLAY_SCALE,
        
    },
    'final_stats': {
        'reward_history': reward_hist,
        'loss_history': loss_hist,
        'distance_history': distance_history,
        'feedback_stats': feedback_stats
    }
}
save_name = f"human_feedback_fc_lr_{EXPERIMENT_TYPE}.pt"
torch.save(final_save, save_name)
print(f"\n Saved: {save_name}")

# 창 정리
if not HEADLESS:
    cv2.destroyAllWindows()