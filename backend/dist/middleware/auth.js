"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJwt = authenticateJwt;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const apiResponse_1 = require("../utils/apiResponse");
function authenticateJwt(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json(apiResponse_1.ApiResponse.error('Missing or invalid Authorization header'));
        return;
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwt.secret);
        req.user = {
            username: decoded.sub || decoded.username,
            role: decoded.role || 'ADMIN',
            fullName: decoded.fullName,
        };
        next();
    }
    catch (err) {
        res.status(401).json(apiResponse_1.ApiResponse.error('Invalid or expired authentication token'));
    }
}
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json(apiResponse_1.ApiResponse.error('Authentication required'));
            return;
        }
        const userRole = (req.user.role || '').toUpperCase();
        const isAllowed = allowedRoles.map((r) => r.toUpperCase()).includes(userRole);
        if (!isAllowed) {
            res.status(403).json(apiResponse_1.ApiResponse.error('Access denied: insufficient permissions'));
            return;
        }
        next();
    };
}
