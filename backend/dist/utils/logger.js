"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
const currentLevel = process.env.LOG_LEVEL === 'DEBUG' ? LogLevel.DEBUG : LogLevel.INFO;
function formatTimestamp() {
    return new Date().toISOString();
}
exports.logger = {
    debug: (message, ...args) => {
        if (currentLevel <= LogLevel.DEBUG) {
            console.log(`[${formatTimestamp()}] [DEBUG] ${message}`, ...args);
        }
    },
    info: (message, ...args) => {
        if (currentLevel <= LogLevel.INFO) {
            console.log(`[${formatTimestamp()}] [INFO]  ${message}`, ...args);
        }
    },
    warn: (message, ...args) => {
        if (currentLevel <= LogLevel.WARN) {
            console.warn(`[${formatTimestamp()}] [WARN]  ${message}`, ...args);
        }
    },
    error: (message, ...args) => {
        if (currentLevel <= LogLevel.ERROR) {
            console.error(`[${formatTimestamp()}] [ERROR] ${message}`, ...args);
        }
    },
};
