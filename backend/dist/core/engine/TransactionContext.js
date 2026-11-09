"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionContext = void 0;
class TransactionContext {
    txnId;
    merchantId;
    amount;
    currency;
    paymentMode;
    payerMobile;
    payerEmail;
    cardToken;
    cardBin;
    cardLast4;
    vpa;
    ipAddress;
    deviceId;
    computed = {};
    constructor(req) {
        this.txnId = req.txnId;
        this.merchantId = req.merchantId;
        this.amount = Number(req.amount) || 0;
        this.currency = req.currency || 'INR';
        this.paymentMode = req.paymentMode;
        this.payerMobile = req.payerMobile;
        this.payerEmail = req.payerEmail;
        this.cardToken = req.cardToken;
        this.cardBin = req.cardBin;
        this.cardLast4 = req.cardLast4;
        this.vpa = req.vpa;
        this.ipAddress = req.ipAddress;
        this.deviceId = req.deviceId;
    }
    getFieldAsString(fieldName) {
        switch (fieldName) {
            case 'txnId':
                return this.txnId;
            case 'merchantId':
                return this.merchantId;
            case 'amount':
                return this.amount != null ? String(this.amount) : null;
            case 'currency':
                return this.currency;
            case 'paymentMode':
                return this.paymentMode || null;
            case 'payerMobile':
                return this.payerMobile || null;
            case 'payerEmail':
                return this.payerEmail || null;
            case 'cardToken':
                return this.cardToken || null;
            case 'cardBin':
                return this.cardBin || null;
            case 'cardLast4':
                return this.cardLast4 || null;
            case 'vpa':
                return this.vpa || null;
            case 'ipAddress':
                return this.ipAddress || null;
            case 'deviceId':
                return this.deviceId || null;
            default:
                return this.computed[fieldName] ? String(this.computed[fieldName]) : null;
        }
    }
}
exports.TransactionContext = TransactionContext;
