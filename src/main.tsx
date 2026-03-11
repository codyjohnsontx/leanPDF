import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app/App';
import { DocumentProvider } from './app/DocumentProvider';
import './index.css';

registerSW({
  onNeedRefresh() {
    const banner = document.createElement('div');
    banner.style.cssText =
      'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#1e293b;color:#f1f5f9;padding:10px 20px;border-radius:8px;z-index:9999;font-family:sans-serif;font-size:14px;';
    banner.textContent = 'App updated — reload to get the latest version';
    const btn = document.createElement('button');
    btn.textContent = 'Reload';
    btn.style.cssText =
      'margin-left:12px;padding:4px 12px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;';
    btn.onclick = () => location.reload();
    banner.appendChild(btn);
    document.body.appendChild(banner);
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DocumentProvider>
        <App />
      </DocumentProvider>
    </BrowserRouter>
  </StrictMode>,
);
