"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var SharkInvestmentSchema = new mongoose_1.Schema({
    phone: { type: String, required: true },
    shark: { type: String, required: true },
    price: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    transactionId: { type: String, required: true },
    level: { type: Number, required: true },
});
// Ensure each user can buy each shark only once, but all users can buy the same shark
SharkInvestmentSchema.index({ phone: 1, shark: 1, level: 1 }, { unique: true });
exports.default = mongoose_1.default.models.SharkInvestment || mongoose_1.default.model('SharkInvestment', SharkInvestmentSchema);
