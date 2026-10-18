import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './redux/store.js';
import { FocusProvider } from './context/FocusContext.jsx';
import './i18n/i18n.js';
import App from './App.jsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <FocusProvider>
        <App />
      </FocusProvider>
    </Provider>
  </React.StrictMode>
);
