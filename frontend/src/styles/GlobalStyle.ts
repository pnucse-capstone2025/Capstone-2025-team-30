import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
    overflow-x: hidden;
    font-family: 'Noto Sans KR', sans-serif;
  }

  #root {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-container {
    flex: 1;
    overflow: auto;
    min-height: 0; /* flex item이 넘치지 않도록 */
  }

  header {
    flex-shrink: 0; /* 헤더가 줄어들지 않도록 */
  }
`;