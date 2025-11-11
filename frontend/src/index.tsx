import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Suppress webpack HMR fetch errors (common with browser extensions)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.addEventListener('error', (event) => {
    if (event.message?.includes('Failed to fetch') && 
        (event.filename?.includes('bundle.js') || 
         event.filename?.includes('sockjs-node'))) {
      event.preventDefault();
      console.warn('HMR connection issue suppressed (likely browser extension interference)');
    }
  }, true);
  
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('Failed to fetch') && 
        (event.reason?.stack?.includes('sockjs-node') || 
         event.reason?.stack?.includes('webpack-dev-server'))) {
      event.preventDefault();
      console.warn('HMR connection issue suppressed (likely browser extension interference)');
    }
  });
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
