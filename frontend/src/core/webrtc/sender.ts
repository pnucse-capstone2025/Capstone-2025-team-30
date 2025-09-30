// 입력 이벤트 수집 및 전송 담당 모듈

import {
  Mouse,
  Keyboard,
  StateEvent,
  TextEvent,
  InputDevice,
  IInputState
} from "./inputdevice";

import { LocalInputManager } from "./inputremoting";
import { PointerCorrector } from "./pointercorrect";
import { Message } from "./inputremoting";

// 디바이스 설명 인터페이스
interface DeviceDescription {
  m_InterfaceName: string;
  m_DeviceClass: string;
  m_Manufacturer: string;
  m_Product: string;
  m_Serial: string;
  m_Version: string;
  m_Capabilities: string;
}

export class Sender extends LocalInputManager {
  private _devices: InputDevice[] = [];
  private _elem: HTMLVideoElement;
  private _corrector: PointerCorrector;
  private mouse?: Mouse;
  private keyboard?: Keyboard;

  constructor(elem: HTMLVideoElement) {
    super();
    this._elem = elem;
    this._corrector = new PointerCorrector(
      this._elem.videoWidth,
      this._elem.videoHeight,
      this._elem
    );

    // 리사이즈 이벤트 처리
    this._elem.addEventListener('resize', this._onResizeEvent.bind(this), false);
    
    // ResizeObserver로 div 크기 변경 감지
    const observer = new ResizeObserver(this._onResizeEvent.bind(this));
    observer.observe(this._elem);
  }

  /**
   * 마우스 디바이스 추가 및 이벤트 리스너 설정
   */
  addMouse(): void {
    const descriptionMouse: DeviceDescription = {
      m_InterfaceName: "RawInput",
      m_DeviceClass: "Mouse",
      m_Manufacturer: "",
      m_Product: "",
      m_Serial: "",
      m_Version: "",
      m_Capabilities: ""
    };

    this.mouse = new Mouse("Mouse", "Mouse", 1, [], descriptionMouse);
    this._devices.push(this.mouse);

    // 마우스 이벤트 리스너 등록
    this._elem.addEventListener('click', this._onMouseEvent.bind(this), false);
    this._elem.addEventListener('mousedown', this._onMouseEvent.bind(this), false);
    this._elem.addEventListener('mouseup', this._onMouseEvent.bind(this), false);
    this._elem.addEventListener('mousemove', this._onMouseEvent.bind(this), false);
    this._elem.addEventListener('wheel', this._onWheelEvent.bind(this), false);
  }

  /**
   * 키보드 디바이스 추가 및 이벤트 리스너 설정
   */
  addKeyboard(): void {
    const descriptionKeyboard: DeviceDescription = {
      m_InterfaceName: "RawInput",
      m_DeviceClass: "Keyboard",
      m_Manufacturer: "",
      m_Product: "",
      m_Serial: "",
      m_Version: "",
      m_Capabilities: ""
    };

    this.keyboard = new Keyboard("Keyboard", "Keyboard", 2, [], descriptionKeyboard);
    this._devices.push(this.keyboard);

    // 키보드 이벤트 리스너 등록 (document 레벨)
    document.addEventListener('keyup', this._onKeyEvent.bind(this), false);
    document.addEventListener('keydown', this._onKeyEvent.bind(this), false);
  }

  /**
   * 등록된 입력 디바이스 목록 반환
   */
  get devices(): InputDevice[] {
    return this._devices;
  }

  /**
   * 비디오 요소 크기 변경 시 좌표 변환기 재설정
   */
  private _onResizeEvent(): void {
    this._corrector.reset(
      this._elem.videoWidth,
      this._elem.videoHeight,
      this._elem
    );
  }

  /**
   * 마우스 이벤트 처리 (클릭, 이동 등)
   */
  private _onMouseEvent(event: MouseEvent): void {
    if (!this.mouse) return;

    this.mouse.queueEvent(event);
    
    // 마우스 좌표를 Unity 좌표계로 변환
    if (this.mouse.currentState && 'position' in this.mouse.currentState) {
      const mouseState = this.mouse.currentState as any;
      mouseState.position = this._corrector.map(mouseState.position);
    }
    
    this._queueStateEvent(this.mouse.currentState!, this.mouse);
  }

  /**
   * 마우스 휠 이벤트 처리
   */
  private _onWheelEvent(event: WheelEvent): void {
    if (!this.mouse) return;

    this.mouse.queueEvent(event);
    this._queueStateEvent(this.mouse.currentState!, this.mouse);
  }

  /**
   * 키보드 이벤트 처리
   */
  private _onKeyEvent(event: KeyboardEvent): void {
    if (!this.keyboard) return;

    if (event.type === 'keydown') {
      // 키 반복 입력이 아닐 때만 StateEvent 전송
      if (!event.repeat) {
        this.keyboard.queueEvent(event);
        this._queueStateEvent(this.keyboard.currentState!, this.keyboard);
      }
      // TextEvent 전송 (문자 입력용)
      this._queueTextEvent(this.keyboard, event);
    } else if (event.type === 'keyup') {
      this.keyboard.queueEvent(event);
      this._queueStateEvent(this.keyboard.currentState!, this.keyboard);
    }
  }

  /**
   * 입력 상태 이벤트를 큐에 추가하여 Unity로 전송
   */
  private _queueStateEvent(state: IInputState, device: InputDevice): void {
    const stateEvent = StateEvent.fromState(state, device.deviceId, this.timeSinceStartup);
    const e = new CustomEvent('event', {
      detail: { 
        event: stateEvent, 
        device: device 
      }
    });
    super.onEvent.dispatchEvent(e);
  }

  /**
   * 텍스트 입력 이벤트를 큐에 추가하여 Unity로 전송
   */
  private _queueTextEvent(device: InputDevice, event: KeyboardEvent): void {
    const textEvent = TextEvent.create(device.deviceId, event, this.timeSinceStartup);
    const e = new CustomEvent('event', {
      detail: { 
        event: textEvent, 
        device: device 
      }
    });
    super.onEvent.dispatchEvent(e);
  }
}

/**
 * RTCDataChannel을 통한 메시지 전송을 위한 Observer 클래스
 */
export class Observer {
  private channel: RTCDataChannel;

  constructor(channel: RTCDataChannel) {
    this.channel = channel;
  }

  /**
   * 메시지를 데이터 채널을 통해 Unity로 전송
   */
  onNext(message: Message): void {
    if (this.channel == null || this.channel.readyState !== 'open') {
      return;
    }
    this.channel.send(message.buffer);
  }
}