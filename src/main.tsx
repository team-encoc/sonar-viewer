import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import MobileViewer from './pages/MobileViewer';
import LoginButtons from './pages/LoginButtons';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/mobile-viewer" element={<MobileViewer />} />
        <Route path="/login-button" element={<LoginButtons />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
