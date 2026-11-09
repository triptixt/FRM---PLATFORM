"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const apiResponse_1 = require("../utils/apiResponse");
const logger_1 = require("../utils/logger");
function errorHandler(err, req, res, next) {
    logger_1.logger.error(`Error handling request [${req.method} ${req.url}]: ${err.message}`, err.stack);
    if (err.name === 'ZodError') {
        const errorDetails = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        res.status(400).json(apiResponse_1.ApiResponse.error(`Validation failed: ${errorDetails}`));
        return;
    }
    if (err.status) {
        res.status(err.status).json(apiResponse_1.ApiResponse.error(err.message));
        return;
    }
    res.status(500).json(apiResponse_1.ApiResponse.error(err.message || 'Internal Server Error'));
}
