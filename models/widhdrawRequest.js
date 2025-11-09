const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 1
        },
        paymentMethod: {
            type: String,
            enum: ["UPI", "Bank Transfer", "Paytm", "Other"],
            required: true
        },
        accountNumber: {
            type: String,
            required: true
        }, // Bank account / UPI ID
        ifsc: {
            type: String
        }, // Optional for bank
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin"
        }, // Admin who approved
        approvedAt: {
            type: Date
        },
        remark: {
            type: String,
            default: "",
            trim: true
        }, // 💬 Reason for rejection/approval
    },
    { timestamps: true }
);

module.exports = mongoose.model("Withdraw", withdrawSchema);




/* const mongoose = require('mongoose');

const WithdrawRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    upi: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WithdrawRequest', WithdrawRequestSchema);
 */