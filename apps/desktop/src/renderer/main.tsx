import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import { App } from './App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/controls.css';
import './styles/panes.css';
import './styles/sidebar.css';
import './styles/path.css';
import './styles/tabs.css';
import './styles/note.css';
import './styles/card.css';
import './styles/chat.css';
import './styles/dialog.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
