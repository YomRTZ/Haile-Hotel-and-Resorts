import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global reset — minimal, page-specific styles live in HotelPage.css / Auth.css
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
