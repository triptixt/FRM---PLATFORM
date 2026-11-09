"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecisionEngine = void 0;
const env_1 = require("../../config/env");
class DecisionEngine {
    static approveBelow = env_1.config.frm.approveBelow;
    static blockFrom = env_1.config.frm.blockFrom;
    static decide(score) {
        if (score >= this.blockFrom) {
            return 'BLOCK';
        }
        if (score >= this.approveBelow) {
            return 'REVIEW';
        }
        return 'ALLOW';
    }
    static updateThresholds(approveBelow, blockFrom) {
        this.approveBelow = approveBelow;
        this.blockFrom = blockFrom;
    }
}
exports.DecisionEngine = DecisionEngine;
