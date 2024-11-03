declare module 'debug' {
  function debug(namespace: string): debug.Debugger;
  
  namespace debug {
    interface Debugger {
      (formatter: any, ...args: any[]): void;
      enabled: boolean;
      namespace: string;
    }
    
    function enable(namespaces: string): void;
    function disable(): string;
    function enabled(namespace: string): boolean;
    
    // Add other methods you might need
    const log: Function;
    const error: Function;
    const warn: Function;
  }
  
  export = debug;
} 