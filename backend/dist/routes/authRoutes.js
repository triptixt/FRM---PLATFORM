"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const env_1 = require("../config/env");
const apiResponse_1 = require("../utils/apiResponse");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json(apiResponse_1.ApiResponse.error('Username and password are required'));
        return;
    }
    try {
        const userRes = await (0, database_1.query)(`SELECT user_id, username, password, full_name, role, status
       FROM frm_admin_user
       WHERE username = $1 AND status = 'ACTIVE'
       LIMIT 1`, [username]);
        if (userRes.rows.length === 0) {
            logger_1.logger.warn(`Login failed: user '${username}' not found or inactive`);
            res.status(401).json(apiResponse_1.ApiResponse.error('Invalid credentials'));
            return;
        }
        const user = userRes.rows[0];
        const passwordMatches = await bcryptjs_1.default.compare(password, user.password);
        if (!passwordMatches) {
            logger_1.logger.warn(`Login failed: invalid password for '${username}'`);
            res.status(401).json(apiResponse_1.ApiResponse.error('Invalid credentials'));
            return;
        }
        const token = jsonwebtoken_1.default.sign({
            sub: user.username,
            role: user.role,
            fullName: user.full_name,
        }, env_1.config.jwt.secret, { expiresIn: env_1.config.jwt.expiresIn });
        logger_1.logger.info(`User logged in successfully: ${user.username} (${user.role})`);
        res.json({
            token,
            username: user.username,
            fullName: user.full_name || '',
            role: user.role,
        });
    }
    catch (err) {
        logger_1.logger.error(`Login error for '${username}': ${err.message}`);
        res.status(500).json(apiResponse_1.ApiResponse.error('Authentication service failure'));
    }
});
exports.default = router;
