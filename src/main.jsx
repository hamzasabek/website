import React from 'react';
import ReactDOM from 'react-dom/client';
import UIkit from 'uikit';
import Icons from 'uikit/dist/js/uikit-icons';
import App from './App.jsx';
import './index.css';

UIkit.use(Icons);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
