const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    type: {
        type: String,
        enum: ["deposit", "withdraw", "bet", "win", "refund", "bonus"],
        required: true,
    },

    amount: {
        type: Number,
        required: true,
        min: 0,
    },

    status: {
        type: String,
        enum: ["pending", "success", "failed"],
        default: "pending",
    },

    // 🎮 Game specific fields
    gameType: {
        type: String, // Example: 'wingo', 'color', 'aviator'
        default: "wingo",
    },
    roundNumber: {
        type: Number,
        default: null,
    },

    // 🔍 Reference IDs (helpful for linking)
    betId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bet",
    },
    withdrawId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Withdraw",
    },
    depositId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Deposit",
    },

    // 🧠 Meta info for tracking
    meta: {
        pickedColor: String,
        pickedNumber: Number,
        resultColor: String,
        resultNumber: Number,
        utr: String,
        paymentMethod: String,
        remark: String,
    },

    // 💰 Balance snapshot
    walletBefore: {
        type: Number,
        default: 0,
    },
    walletAfter: {
        type: Number,
        default: 0,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

transactionSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model("Transaction", transactionSchema);

/* const mongoose = require('mongoose');
const TransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    type: { type: String, enum: ['deposit', 'bet', 'win', 'withdraw'] },
    status: { type: String, default: 'success' }
}, { timestamps: true });
module.exports = mongoose.model('Transaction', TransactionSchema);
 */

/* const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['deposit', 'bet', 'win', 'withdraw'], required: true },
    status: { type: String, default: 'success' },
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
 */