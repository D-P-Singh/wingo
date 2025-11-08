
const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Reference to your User model
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 1,
        },
        paymentMethod: {
            type: String,
            enum: ["UPI", "Bank Transfer", "Paytm", "Other"], // Add as per your system
            required: true,
        },
        utr: {
            type: String,
            required: true,
            unique: true, // ensures no duplicate UTRs
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin", // Optional: Admin who approved
        },
        approvedAt: {
            type: Date,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Deposit", depositSchema);
