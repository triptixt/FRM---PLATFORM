export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const currentLevel: LogLevel =
  process.env.LOG_LEVEL === 'DEBUG' ? LogLevel.DEBUG : LogLevel.INFO;

function formatTimestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (currentLevel <= LogLevel.DEBUG) {
      console.log(`[${formatTimestamp()}] [DEBUG] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (currentLevel <= LogLevel.INFO) {
      console.log(`[${formatTimestamp()}] [INFO]  ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (currentLevel <= LogLevel.WARN) {
      console.warn(`[${formatTimestamp()}] [WARN]  ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (currentLevel <= LogLevel.ERROR) {
      console.error(`[${formatTimestamp()}] [ERROR] ${message}`, ...args);
    }
  },
};

