/**
 * Safe Rendering Utilities
 * Helper functions to safely render data and prevent React crashes
 */

import React from 'react';

/**
 * Safely access nested object properties
 * @param {Object} obj - The object to access
 * @param {string} path - Dot-notation path (e.g., 'summary.introduction')
 * @param {*} defaultValue - Default value if path doesn't exist
 * @returns {*} The value at path or defaultValue
 */
export const safeGet = (obj, path, defaultValue = '') => {
  if (!obj || typeof obj !== 'object') return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result == null || typeof result !== 'object' || !(key in result)) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result ?? defaultValue;
};

/**
 * Safely render an array, handling undefined/null cases
 * @param {*} arr - The array to render
 * @returns {Array} The array or empty array
 */
export const safeArray = (arr) => {
  if (Array.isArray(arr)) return arr;
  return [];
};

/**
 * Safely render a string, handling undefined/null cases
 * @param {*} str - The string to render
 * @param {string} defaultStr - Default string if input is invalid
 * @returns {string} The string or default string
 */
export const safeString = (str, defaultStr = '') => {
  if (typeof str === 'string') return str;
  if (typeof str === 'number') return String(str);
  return defaultStr;
};

/**
 * Safely render a number, handling undefined/null cases
 * @param {*} num - The number to render
 * @param {number} defaultNum - Default number if input is invalid
 * @returns {number} The number or default number
 */
export const safeNumber = (num, defaultNum = 0) => {
  const parsed = Number(num);
  return isNaN(parsed) ? defaultNum : parsed;
};

/**
 * Safely check if an object has a property
 * @param {Object} obj - The object to check
 * @param {string} prop - The property name
 * @returns {boolean} Whether the property exists
 */
export const safeHas = (obj, prop) => {
  return obj != null && typeof obj === 'object' && prop in obj;
};

/**
 * Create a safe version of a component that catches errors
 * @param {Component} Component - The component to wrap
 * @param {Object} fallbackProps - Props to pass to fallback UI
 * @returns {Component} The wrapped component
 */
export const withSafeRender = (Component) => {
  return function SafeComponent(props) {
    try {
      return <Component {...props} />;
    } catch (error) {
      console.error('SafeRender caught error:', error);
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 text-sm">Something went wrong rendering this component.</p>
        </div>
      );
    }
  };
};

/**
 * Hook to safely handle async data fetching with error handling
 * @returns {Object} Safe data fetching utilities
 */
export const useSafeData = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [data, setData] = React.useState(null);

  const fetchData = React.useCallback(async (fetchFn, options = {}) => {
    const { onSuccess, onError, resetOnStart = true } = options;
    
    if (resetOnStart) {
      setError(null);
    }
    setIsLoading(true);

    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
      onSuccess?.(result);
      return { success: true, data: result };
    } catch (err) {
      console.error('Safe data fetch error:', err);
      setError(err);
      onError?.(err);
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = React.useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    fetchData,
    reset,
    hasData: data != null,
    hasError: error != null
  };
};

export default {
  safeGet,
  safeArray,
  safeString,
  safeNumber,
  safeHas,
  withSafeRender,
  useSafeData
};
