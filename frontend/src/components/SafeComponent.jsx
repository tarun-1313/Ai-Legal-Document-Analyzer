import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * SafeComponent - A wrapper that catches errors in child components
 * and displays a fallback UI instead of crashing the whole app
 */
class SafeComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SafeComponent caught error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, compact = false } = this.props;

    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      if (compact) {
        return (
          <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Something went wrong</span>
            </div>
            <button
              onClick={this.handleRetry}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        );
      }

      return (
        <div className="p-8 bg-white/5 border border-white/10 rounded-3xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            Component Error
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            This component encountered an unexpected error.
          </p>
          {import.meta.env.DEV && error && (
            <p className="text-red-400 text-xs font-mono mb-4">
              {error.message}
            </p>
          )}
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return children;
  }
}

export default SafeComponent;
