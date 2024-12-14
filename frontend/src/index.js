import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles/global.css';
import './index.css';
import './i18n'; // Import the i18n configuration
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

ReactDOM.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={<div>Loading...</div>}>
        <App />
      </Suspense>
    </I18nextProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
