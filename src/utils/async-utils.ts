/**
 * Utility functions for handling async operations and preventing render issues
 */

/**
 * Defers execution to the next tick to avoid setState during render
 */
export const deferExecution = <T extends (...args: any[]) => any>(
  fn: T
): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    // Use a microtask to ensure execution happens after render
    await new Promise(resolve => setTimeout(resolve, 0));
    return fn(...args);
  };
};

/**
 * Schedules a state update to happen after the current render cycle
 */
export const scheduleStateUpdate = (updateFn: () => void): void => {
  setTimeout(updateFn, 0);
};

/**
 * Creates a debounced version of a function
 */
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>): void => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Safely executes an async function and handles errors
 */
export const safeAsync = async <T>(
  fn: () => Promise<T>,
  errorHandler?: (error: Error) => void
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error instanceof Error ? error : new Error(String(error)));
    } else {
      console.error('Async operation failed:', error);
    }
    return null;
  }
};

export default {
  deferExecution,
  scheduleStateUpdate,
  debounce,
  safeAsync
};