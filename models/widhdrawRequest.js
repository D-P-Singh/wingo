const mongoose = require('mongoose');
const WithdrawRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: String,
    amount: Number,
    utr: String,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },});
module.exports = mongoose.model('WithdrawRequest', WithdrawRequestSchema);


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