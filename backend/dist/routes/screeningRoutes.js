"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const screeningService_1 = require("../services/screeningService");
const apiResponse_1 = require("../utils/apiResponse");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.post('/screen', auth_1.authenticateJwt, async (req, res) => {
    const { txnId, merchantId, amount } = req.body;
    if (!txnId || !merchantId || amount == null) {
        res.status(400).json(apiResponse_1.ApiResponse.error('Missing required fields: txnId, merchantId, amount'));
        return;
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
        res.status(400).json(apiResponse_1.ApiResponse.error('amount must be a positive number'));
        return;
    }
    try {
        const result = await screeningService_1.ScreeningService.screen(req.body);
        res.json(apiResponse_1.ApiResponse.ok(result));
    }
    catch (err) {
        logger_1.logger.error(`Screening failure for txn ${txnId}: ${err.message}`);
        res.status(500).json(apiResponse_1.ApiResponse.error(`Screening execution error: ${err.message}`));
    }
});
router.get('/health', (req, res) => {
    res.json(apiResponse_1.ApiResponse.ok('FRM service is running'));
});
exports.default = router;
