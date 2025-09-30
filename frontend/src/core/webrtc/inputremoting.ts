import { StateEvent, InputDevice } from "./inputdevice";
import { MemoryHelper } from "./memoryhelper";

// Observer 패턴을 위한 인터페이스
interface Observer {
  onNext(message: Message): void;
}

// 커스텀 이벤트 타입 정의
interface InputEventDetail {
  event: StateEvent;
}

interface DeviceChangeDetail {
  device: InputDevice;
  change: InputDeviceChangeType;
}

export abstract class LocalInputManager {
  private _onevent: EventTarget;
  private _startTime: number = 0;

  constructor() {
    this._onevent = new EventTarget();
  }

  /**
   * Event types: 'event', 'changedeviceusage'
   */
  get onEvent(): EventTarget {
    return this._onevent;
  }

  /**
   * Abstract method - must be implemented by subclasses
   */
  abstract get devices(): InputDevice[] | null;

  /**
   * Get start time in seconds
   */
  get startTime(): number {
    return this._startTime;
  }

  /**
   * Get time since startup in seconds
   */
  get timeSinceStartup(): number {
    return Date.now() / 1000 - this.startTime;
  }

  /**
   * Set start time in seconds
   */
  setStartTime(time: number): void {
    this._startTime = time;
  }
}

export const InputDeviceChange = {
  Added: 0,
  Removed: 1,
  Disconnected: 2,
  Reconnected: 3,
  Enabled: 4,
  Disabled: 5,
  UsageChanged: 6,
  ConfigurationChanged: 7,
  Destroyed: 8,
} as const;

export type InputDeviceChangeType = typeof InputDeviceChange[keyof typeof InputDeviceChange];

export class InputRemoting {
  private _localManager: LocalInputManager;
  private _subscribers: Observer[] = [];
  private _sending: boolean = false;

  constructor(manager: LocalInputManager) {
    this._localManager = manager;
  }

  startSending(): void {
    if (this._sending) {
      return;
    }
    this._sending = true;

    const onEvent = (e: CustomEvent<InputEventDetail>) => {
      this._sendEvent(e.detail.event);
    };

    const onDeviceChange = (e: CustomEvent<DeviceChangeDetail>) => {
      this._sendDeviceChange(e.detail.device, e.detail.change);
    };

    this._localManager.setStartTime(Date.now() / 1000);
    this._localManager.onEvent.addEventListener("event", onEvent as EventListener);
    this._localManager.onEvent.addEventListener("changedeviceusage", onDeviceChange as EventListener);
    this._sendInitialMessages();
  }

  stopSending(): void {
    if (!this._sending) {
      return;
    }
    this._sending = false;
  }

  subscribe(observer: Observer): void {
    this._subscribers.push(observer);
  }

  private _sendInitialMessages(): void {
    this._sendAllGeneratedLayouts();
    this._sendAllDevices();
  }

  private _sendAllGeneratedLayouts(): void {
    // TODO: Implement layout sending
  }

  private _sendAllDevices(): void {
    const devices = this._localManager.devices;
    if (devices == null) return;
    
    for (const device of devices) {
      this._sendDevice(device);
    }
  }

  private _sendDevice(device: InputDevice): void {
    const newDeviceMessage = NewDeviceMsg.create(device);
    this._send(newDeviceMessage);

    // TODO: Implement state event sending
    // const stateEventMessage = NewEventsMsg.createStateEvent(device);
    // this._send(stateEventMessage);
  }

  private _sendEvent(event: StateEvent): void {
    const message = NewEventsMsg.create(event);
    this._send(message);
  }

  private _sendDeviceChange(device: InputDevice, change: InputDeviceChangeType): void {
    if (this._subscribers == null) return;

    let msg: Message | null = null;
    switch (change) {
      case InputDeviceChange.Added:
        msg = NewDeviceMsg.create(device);
        break;
      case InputDeviceChange.Removed:
        msg = RemoveDeviceMsg.create(device);
        break;
      case InputDeviceChange.UsageChanged:
        msg = ChangeUsageMsg.create(device);
        break;
      default:
        return;
    }
    this._send(msg);
  }

  private _send(message: Message): void {
    for (const subscriber of this._subscribers) {
      subscriber.onNext(message);
    }
  }
}

export const MessageType = {
  Connect: 0,
  Disconnect: 1,
  NewLayout: 2,
  NewDevice: 3,
  NewEvents: 4,
  RemoveDevice: 5,
  RemoveLayout: 6,
  ChangeUsages: 7,
  StartSending: 8,
  StopSending: 9,
} as const;

export type MessageTypeValue = typeof MessageType[keyof typeof MessageType];

export class Message {
  public participant_id: number;
  public type: MessageTypeValue;
  public length: number;
  public data: ArrayBuffer;

  constructor(participantId: number, type: MessageTypeValue, data: ArrayBuffer) {
    this.participant_id = participantId;
    this.type = type;
    this.length = data.byteLength;
    this.data = data;
  }

  get buffer(): ArrayBuffer {
    const totalSize = 
      MemoryHelper.sizeOfInt + // size of this.participant_id
      MemoryHelper.sizeOfInt + // size of this.type
      MemoryHelper.sizeOfInt + // size of this.length
      this.data.byteLength;    // size of this.data

    const buffer = new ArrayBuffer(totalSize);
    const dataView = new DataView(buffer);
    const uint8view = new Uint8Array(buffer);
    
    dataView.setUint32(0, this.participant_id, true);
    dataView.setUint32(4, this.type, true);
    dataView.setUint32(8, this.length, true);
    uint8view.set(new Uint8Array(this.data), 12);
    
    return buffer;
  }
}

export class NewDeviceMsg {
  static create(device: InputDevice): Message {
    const data = {
      name: device.name,
      layout: device.layout,
      deviceId: device.deviceId,
      variants: (device as any).variants, // variants 속성이 InputDevice에 없을 수 있음
      description: device.description
    };
    
    const json = JSON.stringify(data);
    const buffer = new ArrayBuffer(json.length);
    const view = new Uint8Array(buffer);
    
    for (let i = 0; i < json.length; i++) {
      view[i] = json.charCodeAt(i);
    }
    
    return new Message(0, MessageType.NewDevice, buffer);
  }
}

export class NewEventsMsg {
  static createStateEvent(device: InputDevice): Message {
    const events = StateEvent.from(device, Date.now() / 1000);
    return NewEventsMsg.create(events);
  }

  static create(event: StateEvent): Message {
    return new Message(0, MessageType.NewEvents, event.buffer);
  }
}

export class RemoveDeviceMsg {
  static create(device: InputDevice): Message {
    const buffer = new ArrayBuffer(MemoryHelper.sizeOfInt);
    const view = new DataView(buffer);
    view.setInt32(0, device.deviceId, true);
    return new Message(0, MessageType.RemoveDevice, buffer);
  }
}

export class ChangeUsageMsg {
  static create(device: InputDevice): Message {
    // TODO: Implement change usage message
    throw new Error(`ChangeUsageMsg class is not implemented. device=${device}`);
  }
}