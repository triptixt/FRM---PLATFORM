"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/reset-password', async (req, res) => {
    const username = req.query.username;
    const newPassword = req.query.newPassword;
    if (!username || !newPassword) {
        res.status(400).json({ error: 'username and newPassword query parameters required' });
        return;
    }
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        const hash = await bcryptjs_1.default.hash(newPassword, salt);
        const result = await (0, database_1.query)(`UPDATE frm_admin_user SET password = $1 WHERE username = $2 RETURNING user_id`, [hash, username]);
        res.json({
            message: result.rows.length > 0 ? 'Password updated' : 'User not found',
            username,
            hashLength: hash.length,
            hashPrefix: hash.substring(0, 7),
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/auth-check', async (req, res) => {
    const username = req.query.username;
    const password = req.query.password;
    if (!username || !password) {
        res.status(400).json({ error: 'username and password query parameters required' });
        return;
    }
    try {
        const result = await (0, database_1.query)(`SELECT user_id, username, password, role, status FROM frm_admin_user WHERE username = $1`, [username]);
        if (result.rows.length === 0) {
            res.json({ found: false });
            return;
        }
        const u = result.rows[0];
        const matches = await bcryptjs_1.default.compare(password, u.password);
        res.json({
            found: true,
            username: u.username,
            role: u.role,
            status: u.status,
            hashLength: u.password ? u.password.length : 0,
            hashPrefix: u.password && u.password.length > 6 ? u.password.substring(0, 7) : 'short',
            passwordMatches: matches,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
