"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionStatus = exports.TransactionType = void 0;
var mongoose_1 = require("mongoose");
var TransactionType;
(function (TransactionType) {
    TransactionType["PURCHASE"] = "purchase";
    TransactionType["REFERRAL"] = "referral";
    TransactionType["WITHDRAWAL"] = "withdrawal";
    TransactionType["DEPOSIT"] = "deposit";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["COMPLETED"] = "completed";
    TransactionStatus["FAILED"] = "failed";
    TransactionStatus["CANCELLED"] = "cancelled";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var TransactionSchema = new mongoose_1.Schema({
    phone: { type: String, required: true },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: Object.values(TransactionStatus),
        default: TransactionStatus.PENDING
    },
    transactionId: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    qrCode: { type: String },
    relatedPhone: { type: String },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});
exports.default = mongoose_1.default.models.Transaction || mongoose_1.default.model('Transaction', TransactionSchema);
