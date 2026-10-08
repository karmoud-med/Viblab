import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class GlobalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, error: null, errorInfo: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('VibLab Uncaught Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif', maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 12, border: '1px solid #E3E1DA', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#FEE4E2', color: '#B42318', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 20 }}>!</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, color: '#0F1B2D' }}>Une erreur d'affichage est survenue</h2>
              <p style={{ margin: 0, fontSize: 13, color: '#5B6675' }}>VibLab a intercepté l'incident pour éviter un écran blanc.</p>
            </div>
          </div>
          <div style={{ background: '#FAF9F6', padding: 16, borderRadius: 8, border: '1px solid #E3E1DA', fontSize: 12, fontFamily: 'monospace', color: '#B42318', whiteSpace: 'pre-wrap', overflowX: 'auto', marginBottom: 16 }}>
            {this.state.error?.toString()}
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('viblab_active_tab');
              window.location.reload();
            }}
            style={{ padding: '8px 16px', background: '#1F4E8C', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Recharger la plateforme
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
);
