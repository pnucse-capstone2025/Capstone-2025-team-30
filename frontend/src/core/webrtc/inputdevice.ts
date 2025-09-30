import { MemoryHelper } from "./memoryhelper";
import { CharNumber } from "./charnumber";
import { Keymap } from "./keymap";
import { MouseButton } from "./mousebutton";

export class FourCC {
  private _code: number;

  constructor(a: string, b: string, c: string, d: string) {
    this._code = (a.charCodeAt(0) << 24)
      | (b.charCodeAt(0) << 16)
      | (c.charCodeAt(0) << 8)
      | d.charCodeAt(0);
  }

  toInt32(): number {
    return this._code;
  }
}

export abstract class InputDevice {
  public name: string;
  public layout: string;
  public deviceId: number;
  public usages: string[];
  public description: object;
  private _inputState: IInputState | null;

  constructor(name: string, layout: string, deviceId: number, usages: string[], description: object) {
    this.name = name;
    this.layout = layout;
    this.deviceId = deviceId;
    this.usages = usages;
    this.description = description;
    this._inputState = null;
  }

  updateState(state: IInputState): void {
    this._inputState = state;
  }

  abstract queueEvent(event: Event, ...args: any[]): void;

  get currentState(): IInputState | null {
    return this._inputState;
  }
}

export class Mouse extends InputDevice {
  queueEvent(event: MouseEvent | WheelEvent): void {
    this.updateState(new MouseState(event));
  }
}

export class Keyboard extends InputDevice {
  static get keycount(): number { 
    return 110; 
  }

  queueEvent(event: KeyboardEvent): void {
    this.updateState(new KeyboardState(event, this.currentState as KeyboardState | null));
  }
}

export class InputEvent {
  static get invalidEventId(): number { 
    return 0; 
  }
  
  static get size(): number { 
    return 20; 
  }

  public type: number;
  public sizeInBytes: number;
  public deviceId: number;
  public time: number;
  public eventId: number;

  constructor(type: number, sizeInBytes: number, deviceId: number, time: number) {
    this.type = type;
    this.sizeInBytes = sizeInBytes;
    this.deviceId = deviceId;
    this.time = time;
    this.eventId = InputEvent.invalidEventId;
  }

  get buffer(): ArrayBuffer {
    const _buffer = new ArrayBuffer(InputEvent.size);
    const view = new DataView(_buffer);
    view.setInt32(0, this.type, true);
    view.setInt16(4, this.sizeInBytes, true);
    view.setInt16(6, this.deviceId, true);
    view.setFloat64(8, this.time, true);
    view.setInt16(16, this.sizeInBytes, true);
    return _buffer;
  }
}

export abstract class IInputState {
  abstract get buffer(): ArrayBuffer;
  abstract get format(): number;
}

export class MouseState extends IInputState {
  static get size(): number { 
    return 30; 
  }
  
  static get format(): number { 
    return new FourCC('M', 'O', 'U', 'S').toInt32(); 
  }

  public position: [number, number];
  public delta: [number, number];
  public scroll: [number, number];
  public buttons: ArrayBuffer;
  public displayIndex: number = 0;
  public clickCount: number = 0;

  constructor(event: MouseEvent | WheelEvent) {
    super();

    this.position = [event.clientX, event.clientY];
    this.delta = [event.movementX, -event.movementY];
    this.scroll = [0, 0];
    
    if (event.type === 'wheel') {
      const wheelEvent = event as WheelEvent;
      this.scroll = [wheelEvent.deltaX, wheelEvent.deltaY];
    }
    
    this.buttons = new ArrayBuffer(2);

    const left = (event.buttons & (1 << 0)) !== 0;
    const right = (event.buttons & (1 << 1)) !== 0;
    const middle = (event.buttons & (1 << 2)) !== 0;
    const back = (event.buttons & (1 << 3)) !== 0;
    const forward = (event.buttons & (1 << 4)) !== 0;

    MemoryHelper.writeSingleBit(this.buttons, MouseButton.Left, left);
    MemoryHelper.writeSingleBit(this.buttons, MouseButton.Right, right);
    MemoryHelper.writeSingleBit(this.buttons, MouseButton.Middle, middle);
    MemoryHelper.writeSingleBit(this.buttons, MouseButton.Forward, forward);
    MemoryHelper.writeSingleBit(this.buttons, MouseButton.Back, back);
  }

  get buffer(): ArrayBuffer {
    const size = MouseState.size;
    const buttons = new Uint16Array(this.buttons)[0];
    const _buffer = new ArrayBuffer(size);
    const view = new DataView(_buffer);
    view.setFloat32(0, this.position[0], true);
    view.setFloat32(4, this.position[1], true);
    view.setFloat32(8, this.delta[0], true);
    view.setFloat32(12, this.delta[1], true);
    view.setFloat32(16, this.scroll[0], true);
    view.setFloat32(20, this.scroll[1], true);
    view.setUint16(24, buttons, true);
    view.setUint16(26, this.displayIndex, true);
    view.setUint16(28, this.clickCount, true);
    return _buffer;
  }

  get format(): number {
    return MouseState.format;
  }
}

export class KeyboardState extends IInputState {
  static get sizeInBits(): number { 
    return Keyboard.keycount; 
  }
  
  static get sizeInBytes(): number { 
    return (KeyboardState.sizeInBits + 7) >> 3; 
  }
  
  static get format(): number { 
    return new FourCC('K', 'E', 'Y', 'S').toInt32(); 
  }

  public keys: ArrayBuffer;

  constructor(event: KeyboardEvent, state: KeyboardState | null) {
    super();

    if (state == null || state.keys == null) {
      this.keys = new ArrayBuffer(KeyboardState.sizeInBytes);
    } else {
      this.keys = state.keys;
    }
    
    let value = false;
    switch (event.type) {
      case 'keydown':
        value = true;
        break;
      case 'keyup':
        value = false;
        break;
      default:
        throw new Error(`unknown event type ${event.type}`);
    }
    
    const key = Keymap[event.code as keyof typeof Keymap];
    if (key !== undefined) {
      MemoryHelper.writeSingleBit(this.keys, key, value);
    }
  }

  get buffer(): ArrayBuffer {
    return this.keys;
  }

  get format(): number {
    return KeyboardState.format;
  }
}

export class TextEvent {
  static get format(): number { 
    return new FourCC('T', 'E', 'X', 'T').toInt32(); 
  }

  public baseEvent!: InputEvent;
  public character!: number;

  static create(deviceId: number, event: KeyboardEvent, time: number): TextEvent {
    const eventSize = InputEvent.size + MemoryHelper.sizeOfInt;

    const textEvent = new TextEvent();
    textEvent.baseEvent = new InputEvent(TextEvent.format, eventSize, deviceId, time);
    textEvent.character = CharNumber[event.key as keyof typeof CharNumber] || 0;
    return textEvent;
  }

  get buffer(): ArrayBuffer {
    const size = InputEvent.size + MemoryHelper.sizeOfInt;
    const _buffer = new ArrayBuffer(size);
    const arrayView = new Uint8Array(_buffer);
    const dataView = new DataView(_buffer);
    arrayView.set(new Uint8Array(this.baseEvent.buffer), 0);
    dataView.setInt32(InputEvent.size, this.character, true);
    return _buffer;
  }
}

export class StateEvent {
  static get format(): number { 
    return new FourCC('S', 'T', 'A', 'T').toInt32(); 
  }

  public baseEvent!: InputEvent;
  public stateFormat!: number;
  public stateData!: ArrayBuffer;

  static from(device: InputDevice, time: number): StateEvent {
    if (!device.currentState) {
      throw new Error('Device has no current state');
    }
    return StateEvent.fromState(device.currentState, device.deviceId, time);
  }

  static fromState(state: IInputState, deviceId: number, time: number): StateEvent {
    const stateData = state.buffer;
    const stateSize = stateData.byteLength;
    const eventSize = InputEvent.size + MemoryHelper.sizeOfInt + stateSize;

    const stateEvent = new StateEvent();
    stateEvent.baseEvent = new InputEvent(StateEvent.format, eventSize, deviceId, time);
    stateEvent.stateFormat = state.format;
    stateEvent.stateData = stateData;
    return stateEvent;
  }

  get buffer(): ArrayBuffer {
    const stateSize = this.stateData.byteLength;
    const size = InputEvent.size + MemoryHelper.sizeOfInt + stateSize;
    const _buffer = new ArrayBuffer(size);
    const uint8View = new Uint8Array(_buffer);
    const dataView = new DataView(_buffer);
    uint8View.set(new Uint8Array(this.baseEvent.buffer), 0);
    dataView.setInt32(InputEvent.size, this.stateFormat, true);
    uint8View.set(new Uint8Array(this.stateData), InputEvent.size + MemoryHelper.sizeOfInt);
    return _buffer;
  }
}