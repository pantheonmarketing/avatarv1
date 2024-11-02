const DEBUG = process.env.NODE_ENV !== 'production';

export const debug = {
  log: (...args: any[]) => {
    if (DEBUG) {
      console.log('[Debug]:', ...args);
    }
  },
  error: (error: any, context: string) => {
    console.error(`[Error] ${context}:`, error);
    if (DEBUG && error.stack) {
      console.error(error.stack);
    }
  },
  warn: (...args: any[]) => {
    if (DEBUG) {
      console.warn('[Warning]:', ...args);
    }
  },
  info: (...args: any[]) => {
    if (DEBUG) {
      console.info('[Info]:', ...args);
    }
  }
}; 