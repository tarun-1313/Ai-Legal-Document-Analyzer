import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
    
    // Log to console for debugging
    if (import.meta.env.DEV) {
      console.group('🚨 React Error Boundary Caught');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo?.componentStack);
      console.groupEnd();
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;
      const isRecoverable = errorCount < 3;
      
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-dark">
          <div className="w-full max-w-2xl">
            {/* Main Error Card */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 text-center shadow-2xl">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-24 h-24 bg-red-500/10 rounded-full mb-6">
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
              
              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Something Went Wrong
              </h1>
              
              {/* Description */}
              <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto">
                We&apos;re sorry, but something unexpected happened. Our team has been notified of this issue.
              </p>
              
              {/* Error Details (Development Only) */}
              {import.meta.env.DEV && error && (
                <div className="mb-8 p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-left">
                  <p className="text-red-400 font-mono text-sm mb-2">Error: {error.message || error}</p>
                  {errorInfo?.componentStack && (
                    <pre className="text-red-400/70 font-mono text-xs overflow-auto max-h-40">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isRecoverable ? (
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                  >
                    <RefreshCcw size={18} />
                    Try Again
                  </button>
                ) : (
                  <button
                    onClick={this.handleReload}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                  >
                    <RefreshCcw size={18} />
                    Reload Page
                  </button>
                )}
                
                <button
                  onClick={this.handleGoHome}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
                >
                  <Home size={18} />
                  Go Home
                </button>
              </div>
            </div>
            
            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">
                If this problem persists, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
