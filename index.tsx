
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ChallengeProvider } from './context/ChallengeContext';
import { VocabularyProvider } from './context/VocabularyContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <ChallengeProvider>
        <VocabularyProvider>
          <App />
        </VocabularyProvider>
      </ChallengeProvider>
    </AuthProvider>
  </React.StrictMode>
);