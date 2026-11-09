"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    static ok(data) {
        return {
            success: true,
            data,
            timestamp: new Date().toISOString(),
        };
    }
    static okWithMessage(message, data) {
        return {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString(),
        };
    }
    static error(message) {
        return {
            success: false,
            message,
            timestamp: new Date().toISOString(),
        };
    }
}
exports.ApiResponse = ApiResponse;
