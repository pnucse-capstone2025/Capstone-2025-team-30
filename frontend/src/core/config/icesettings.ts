/**
 * ICE 서버 설정 관리 모듈
 * 
 * 이 코드는 WebRTC 샘플에서 참조
 * @see https://github.com/webrtc/samples/blob/gh-pages/src/content/peerconnection/trickle-ice/js/main.js
 */

/** 로컬 스토리지에 저장될 서버 목록의 키 */
const SERVERS_STORAGE_KEY = 'servers';

// DOM 요소들 (브라우저 환경에서만 사용)
let serversSelect: HTMLSelectElement | null = null;
let urlInputElement: HTMLInputElement | null = null;
let usernameInputElement: HTMLInputElement | null = null;
let passwordInputElement: HTMLInputElement | null = null;

// 브라우저 환경에서만 DOM 요소 초기화
if (typeof document !== 'undefined') {
  serversSelect = document.querySelector('select#servers');
  urlInputElement = document.querySelector('input#url');
  usernameInputElement = document.querySelector('input#username');
  passwordInputElement = document.querySelector('input#password');
}

/**
 * ICE 서버를 목록에 추가하는 함수
 * 사용자가 입력한 URL, 사용자명, 비밀번호를 검증하고 서버 목록에 추가
 */
export function addServer(): void {
  if (!serversSelect || !urlInputElement || !usernameInputElement || !passwordInputElement) {
    console.warn('DOM elements not available');
    return;
  }

  const urlScheme = urlInputElement.value.split(':')[0];
  if (!['stun', 'stuns', 'turn', 'turns'].includes(urlScheme)) {
    alert(`URI scheme ${urlScheme} is not valid`);
    return;
  }

  // ICE 서버를 JSON 문자열로 option.value에 저장
  const optionElement = document.createElement('option');
  const iceServer: RTCIceServer = {
    urls: [urlInputElement.value],
    username: usernameInputElement.value || undefined,
    credential: passwordInputElement.value || undefined
  };
  
  optionElement.value = JSON.stringify(iceServer);
  optionElement.text = `${urlInputElement.value} `;
  
  const username = usernameInputElement.value;
  const password = passwordInputElement.value;
  if (username || password) {
    optionElement.text += (` [${username}:${password}]`);
  }
  
  optionElement.ondblclick = selectServer;
  serversSelect.add(optionElement);
  
  urlInputElement.value = usernameInputElement.value = passwordInputElement.value = '';
  writeServersToLocalStorage();
}

/**
 * 선택된 ICE 서버를 목록에서 제거하는 함수
 */
export function removeServer(): void {
  if (!serversSelect) {
    console.warn('Servers element not available');
    return;
  }

  for (let index = serversSelect.options.length - 1; index >= 0; --index) {
    if (serversSelect.options[index].selected) {
      serversSelect.remove(index);
    }
  }
  writeServersToLocalStorage();
}

/**
 * ICE 서버 설정을 초기화하는 함수
 * 로컬 스토리지를 지우고 기본 서버로 재설정
 */
export function reset(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
  }
  
  if (typeof document !== 'undefined') {
    document.querySelectorAll('select#servers option').forEach(option => option.remove());
    const serversSelectElement = document.querySelector('select#servers') as HTMLSelectElement;
    if (serversSelectElement) {
      setDefaultServer(serversSelectElement);
    }
  }
}

/**
 * 서버 선택 시 입력 필드를 업데이트하는 함수
 * @param event - 더블클릭 이벤트
 */
function selectServer(event: Event): void {
  if (!urlInputElement || !usernameInputElement || !passwordInputElement) {
    console.warn('Input elements not available');
    return;
  }

  const selectedOption = event.target as HTMLOptionElement;
  const serverConfig: RTCIceServer = JSON.parse(selectedOption.value);
  
  urlInputElement.value = Array.isArray(serverConfig.urls) ? serverConfig.urls[0] : serverConfig.urls;
  usernameInputElement.value = serverConfig.username || '';
  passwordInputElement.value = serverConfig.credential || '';
}

/**
 * 기본 ICE 서버를 설정하는 함수
 * @param serversSelectElement - 서버 선택 요소
 */
function setDefaultServer(serversSelectElement: HTMLSelectElement): void {
  const defaultOption = document.createElement('option');
  defaultOption.value = '{"urls":["stun:stun.l.google.com:19302"]}';
  defaultOption.text = 'stun:stun.l.google.com:19302';
  defaultOption.ondblclick = selectServer;
  serversSelectElement.add(defaultOption);
}

/**
 * 서버 목록을 로컬 스토리지에 저장하는 함수
 */
function writeServersToLocalStorage(): void {
  if (typeof window === 'undefined' || !serversSelect) {
    return;
  }

  const allServers = JSON.stringify(
    Array.from(serversSelect.options).map(option => JSON.parse(option.value))
  );
  window.localStorage.setItem(SERVERS_STORAGE_KEY, allServers);
}

/**
 * 로컬 스토리지에서 서버 목록을 읽어와 UI에 적용하는 함수
 */
export function readServersFromLocalStorage(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  document.querySelectorAll('select#servers option').forEach(option => option.remove());
  const serversSelectElement = document.querySelector('select#servers') as HTMLSelectElement;
  
  if (!serversSelectElement) {
    return;
  }

  const storedServers = window.localStorage.getItem(SERVERS_STORAGE_KEY);

  if (storedServers === null || storedServers === '') {
    setDefaultServer(serversSelectElement);
  } else {
    const servers: RTCIceServer[] = JSON.parse(storedServers);
    servers.forEach((server) => {
      const optionElement = document.createElement('option');
      optionElement.value = JSON.stringify(server);
      optionElement.text = Array.isArray(server.urls) ? server.urls[0] : server.urls;
      optionElement.ondblclick = selectServer;
      serversSelectElement.add(optionElement);
    });
  }
}

/**
 * 저장된 ICE 서버 목록을 반환하는 함수
 * 서버 사이드 렌더링 환경에서는 기본 STUN 서버를 반환
 * 
 * @returns ICE 서버 목록 배열
 */
export function getServers(): RTCIceServer[] {
  if (typeof window === 'undefined') {
    // 서버 사이드 렌더링 환경에서는 기본값 반환
    return [
      { urls: ['stun:stun.l.google.com:19302'] },
      { urls: ['stun:stun1.l.google.com:19302'] },
      { urls: ['stun:stun2.l.google.com:19302'] },
      { urls: ['stun:stun3.l.google.com:19302'] },
      { urls: ['stun:stun4.l.google.com:19302'] }
    ];
  }

  const storedServers = window.localStorage.getItem(SERVERS_STORAGE_KEY);

  if (storedServers === null || storedServers === '') {
    // 기본 STUN 서버들 (다양한 Google STUN 서버)
    return [
      { urls: ['stun:stun.l.google.com:19302'] },
      { urls: ['stun:stun1.l.google.com:19302'] },
      { urls: ['stun:stun2.l.google.com:19302'] },
      { urls: ['stun:stun3.l.google.com:19302'] },
      { urls: ['stun:stun4.l.google.com:19302'] }
    ];
  } else {
    return JSON.parse(storedServers);
  }
}
