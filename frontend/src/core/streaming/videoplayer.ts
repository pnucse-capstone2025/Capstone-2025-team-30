import { Observer, Sender } from "../webrtc/sender";
import { InputRemoting } from "../webrtc/inputremoting";

export class VideoPlayer {
  private playerElement: HTMLDivElement | null = null;
  private lockMouseCheck: HTMLInputElement | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private inputRemoting: InputRemoting | null = null;
  private sender: Sender | null = null;
  private inputSenderChannel: RTCDataChannel | null = null;
  private _videoScale: number = 1;
  private _videoOriginX: number = 0;
  private _videoOriginY: number = 0;

  constructor() {
    // 모든 속성은 위에서 초기화됨
  }

  /**
   * 비디오 플레이어 생성
   * @param playerElement 부모 요소
   * @param lockMouseCheck 마우스 락 체크박스
   */
  createPlayer(playerElement: HTMLDivElement, lockMouseCheck: HTMLInputElement): void {
    this.playerElement = playerElement;
    this.lockMouseCheck = lockMouseCheck;

    // 비디오 요소 생성
    this.videoElement = document.createElement('video');
    this.videoElement.id = 'Video';
    this.videoElement.style.touchAction = 'none';
    this.videoElement.playsInline = true;
    this.videoElement.srcObject = new MediaStream();
    this.videoElement.addEventListener('loadedmetadata', this._onLoadedVideo.bind(this), true);
    this.playerElement.appendChild(this.videoElement);

    // 마우스 클릭 이벤트 (포인터 락 복원용)
    this.videoElement.addEventListener("click", this._mouseClick.bind(this), false);
  }

  /**
   * 비디오 로드 완료 이벤트
   */
  private _onLoadedVideo(): void {
    if (this.videoElement) {
      this.videoElement.play();
      this.resizeVideo();
    }
  }

  /**
   * 마우스 클릭 이벤트 (포인터 락 복원)
   */
  private _mouseClick(): void {
    if (this.lockMouseCheck?.checked && this.videoElement) {
      if (this.videoElement.requestPointerLock) {
        this.videoElement.requestPointerLock().catch(() => {
          // 포인터 락 실패 시 무시
        });
      }
    }
  }

  /**
   * 미디어 트랙 추가
   * @param track 미디어 트랙
   */
  addTrack(track: MediaStreamTrack): void {
    if (!this.videoElement?.srcObject) {
      return;
    }

    const mediaStream = this.videoElement.srcObject as MediaStream;
    mediaStream.addTrack(track);
  }

  /**
   * 비디오 크기 조정
   */
  resizeVideo(): void {
    if (!this.videoElement) {
      return;
    }

    const clientRect = this.videoElement.getBoundingClientRect();
    const videoRatio = this.videoWidth / this.videoHeight;
    const clientRatio = clientRect.width / clientRect.height;

    this._videoScale = videoRatio > clientRatio 
      ? clientRect.width / this.videoWidth 
      : clientRect.height / this.videoHeight;
      
    const videoOffsetX = videoRatio > clientRatio 
      ? 0 
      : (clientRect.width - this.videoWidth * this._videoScale) * 0.5;
      
    const videoOffsetY = videoRatio > clientRatio 
      ? (clientRect.height - this.videoHeight * this._videoScale) * 0.5 
      : 0;
      
    this._videoOriginX = clientRect.left + videoOffsetX;
    this._videoOriginY = clientRect.top + videoOffsetY;
  }

  /**
   * 비디오 폭 getter
   */
  get videoWidth(): number {
    return this.videoElement?.videoWidth || 0;
  }

  /**
   * 비디오 높이 getter
   */
  get videoHeight(): number {
    return this.videoElement?.videoHeight || 0;
  }

  /**
   * 비디오 원점 X 좌표 getter
   */
  get videoOriginX(): number {
    return this._videoOriginX;
  }

  /**
   * 비디오 원점 Y 좌표 getter
   */
  get videoOriginY(): number {
    return this._videoOriginY;
  }

  /**
   * 비디오 스케일 getter
   */
  get videoScale(): number {
    return this._videoScale;
  }

  /**
   * 플레이어 삭제
   */
  deletePlayer(): void {
    if (this.inputRemoting) {
      this.inputRemoting.stopSending();
    }
    
    this.inputRemoting = null;
    this.sender = null;
    this.inputSenderChannel = null;

    while (this.playerElement?.firstChild) {
      this.playerElement.removeChild(this.playerElement.firstChild);
    }

    this.playerElement = null;
    this.lockMouseCheck = null;
    this.videoElement = null;
  }

  /**
   * 터치 디바이스 감지
   */
  private _isTouchDevice(): boolean {
    return (('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      ((navigator as any).msMaxTouchPoints > 0));
  }

  /**
   * 입력 데이터 채널 설정 (마우스/키보드/터치/게임패드)
   * @param channel RTCDataChannel
   */
  setupInput(channel: RTCDataChannel | null): void {
    if (!channel || !this.videoElement) {
      return;
    }

    this.sender = new Sender(this.videoElement);
    this.sender.addMouse();
    this.sender.addKeyboard();
    
    if (this._isTouchDevice()) {
      // 터치스크린 지원이 있다면 추가
      // this.sender.addTouchscreen();
    }
    
    // 게임패드 지원이 있다면 추가
    // this.sender.addGamepad();
    
    this.inputRemoting = new InputRemoting(this.sender);
    this.inputSenderChannel = channel;
    
    this.inputSenderChannel.onopen = this._onOpenInputSenderChannel.bind(this);
    this.inputRemoting.subscribe(new Observer(this.inputSenderChannel));
  }

  /**
   * 입력 송신 채널 열림 이벤트
   */
  private async _onOpenInputSenderChannel(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (this.inputRemoting) {
      this.inputRemoting.startSending();
    }
  }
}
