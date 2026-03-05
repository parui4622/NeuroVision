import axios from 'axios';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

axios.defaults.withCredentials = true; // Ensure cookies are sent with requests

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
