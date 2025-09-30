// 마우스 좌표 변환을 담당하는 모듈

export const LetterBoxType = {
  Vertical: 0,
  Horizontal: 1
} as const;

export type LetterBoxTypeValue = typeof LetterBoxType[keyof typeof LetterBoxType];

// 좌표와 크기를 나타내는 인터페이스
interface ContentRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class PointerCorrector {
  private _videoWidth: number;
  private _videoHeight: number;
  private _videoElem: HTMLVideoElement;
  private _contentRect: ContentRect;

  constructor(videoWidth: number, videoHeight: number, videoElem: HTMLVideoElement) {
    this._videoWidth = videoWidth;
    this._videoHeight = videoHeight;
    this._videoElem = videoElem;
    this._contentRect = { x: 0, y: 0, width: 0, height: 0 };
    this.reset(videoWidth, videoHeight, videoElem);
  }

  /**
   * 브라우저 마우스 좌표를 Unity 게임 좌표로 변환
   * @param position - [MouseEvent.clientX, MouseEvent.clientY]
   * @returns Unity 좌표 [x, y]
   */
  map(position: [number, number]): [number, number] {
    const rect = this._videoElem.getBoundingClientRect();
    const _position: [number, number] = [0, 0];

    // (1) 브라우저 절대좌표를 비디오 엘리먼트 상대좌표로 변환
    _position[0] = position[0] - rect.left;
    _position[1] = position[1] - rect.top;

    // (2) 웹 좌표계를 Unity 좌표계로 변환 (Y축 뒤집기)
    _position[1] = rect.height - _position[1];

    // (3) 레터박스 오프셋 제거
    _position[0] -= this._contentRect.x;
    _position[1] -= this._contentRect.y;

    // (4) 표시 크기를 실제 비디오 해상도로 스케일링
    _position[0] = (_position[0] / this._contentRect.width) * this._videoWidth;
    _position[1] = (_position[1] / this._contentRect.height) * this._videoHeight;

    return _position;
  }

  /**
   * 비디오 너비 설정
   */
  setVideoWidth(videoWidth: number): void {
    this._videoWidth = videoWidth;
    this._reset();
  }

  /**
   * 비디오 높이 설정
   */
  setVideoHeight(videoHeight: number): void {
    this._videoHeight = videoHeight;
    this._reset();
  }

  /**
   * 비디오 엘리먼트 설정
   */
  setRect(videoElem: HTMLVideoElement): void {
    this._videoElem = videoElem;
    this._reset();
  }

  /**
   * 모든 설정 초기화
   */
  reset(videoWidth: number, videoHeight: number, videoElem: HTMLVideoElement): void {
    this._videoWidth = videoWidth;
    this._videoHeight = videoHeight;
    this._videoElem = videoElem;
    this._reset();
  }

  /**
   * 레터박스 타입 확인 (세로/가로 여백)
   */
  get letterBoxType(): LetterBoxTypeValue {
    const videoRatio = this._videoHeight / this._videoWidth;
    const rect = this._videoElem.getBoundingClientRect();
    const rectRatio = rect.height / rect.width;
    return videoRatio > rectRatio ? LetterBoxType.Vertical : LetterBoxType.Horizontal;
  }

  /**
   * 레터박스 크기 계산
   */
  get letterBoxSize(): number {
    const rect = this._videoElem.getBoundingClientRect();
    
    switch (this.letterBoxType) {
      case LetterBoxType.Horizontal: {
        const ratioWidth = rect.width / this._videoWidth;
        const height = this._videoHeight * ratioWidth;
        return (rect.height - height) * 0.5;
      }
      case LetterBoxType.Vertical: {
        const ratioHeight = rect.height / this._videoHeight;
        const width = this._videoWidth * ratioHeight;
        return (rect.width - width) * 0.5;
      }
      default:
        throw new Error('Invalid letterbox type');
    }
  }

  /**
   * 실제 비디오 콘텐츠가 표시되는 영역 계산
   * CSS object-fit 등은 고려하지 않음
   */
  get contentRect(): ContentRect {
    const letterBoxType = this.letterBoxType;
    const letterBoxSize = this.letterBoxSize;
    const rect = this._videoElem.getBoundingClientRect();

    const x = letterBoxType === LetterBoxType.Vertical ? letterBoxSize : 0;
    const y = letterBoxType === LetterBoxType.Horizontal ? letterBoxSize : 0;
    const width = letterBoxType === LetterBoxType.Vertical 
      ? rect.width - letterBoxSize * 2 
      : rect.width;
    const height = letterBoxType === LetterBoxType.Horizontal 
      ? rect.height - letterBoxSize * 2 
      : rect.height;

    return { x, y, width, height };
  }

  private _reset(): void {
    this._contentRect = this.contentRect;
  }
}