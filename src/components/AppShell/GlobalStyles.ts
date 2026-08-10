import { createGlobalStyle } from 'styled-components'

const GlobalStyles = createGlobalStyle`
  :root {
    --color-bg: #0f1a0f;
    --color-surface: #1a2b1a;
    --color-surface-alt: #243524;
    --color-gold: #c9a84c;
    --color-gold-bright: #f0c040;
    --color-text-primary: #ede0c4;
    --color-text-muted: #9e9a85;
    --color-border: #2e4a2e;
    --color-error: #8b2635;
    --color-error-text: #f4a0a8;
    --shadow-input: 0 2px 8px rgba(0, 0, 0, 0.35);
    --shadow-panel: 0 -4px 16px rgba(0, 0, 0, 0.4);
  }

  [data-theme="light"] {
    --color-bg: #f5f0e8;
    --color-surface: #ece4d0;
    --color-surface-alt: #e0d5be;
    --color-gold: #a07820;
    --color-gold-bright: #c09030;
    --color-text-primary: #1a1a0f;
    --color-text-muted: #5a5540;
    --color-border: #b0a880;
    --color-error: #fde8ea;
    --color-error-text: #8b1520;
    --shadow-input: 0 4px 20px rgba(0, 0, 0, 0.14), 0 2px 6px rgba(0, 0, 0, 0.09);
    --shadow-panel: 0 -4px 20px rgba(0, 0, 0, 0.08), 0 -1px 4px rgba(0, 0, 0, 0.05);
  }

  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    font-size: 15px;
    font-weight: 400;
    line-height: 1.6;
    color: var(--color-text-primary);
    -webkit-font-smoothing: antialiased;
    transition: background-color 0.25s ease, color 0.25s ease;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  h1, h2, h3, h4 {
    font-weight: 700;
    letter-spacing: -0.025em;
    margin: 0;
    line-height: 1.2;
  }

  button {
    font-family: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  input, textarea {
    font-family: inherit;
    font-size: inherit;
  }
`

export default GlobalStyles
