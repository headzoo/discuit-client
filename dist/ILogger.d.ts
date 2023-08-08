/**
 * Interface for standard loggers.
 */
export interface ILogger {
    debug: (message: string, context?: any) => void;
    error: (message: string, context?: any) => void;
    info: (message: string, context?: any) => void;
    warn: (message: string, context?: any) => void;
}
