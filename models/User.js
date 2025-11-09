// models/User.js
const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    password: String,
    walletBalance: { type: Number, default: 50 },
    address: String,
    upi: String,
    bankName: String,
    accountNumber: String,
    ifsc: String,
    photo: String,
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false }, // Admin flag
    blocked: { type: Boolean, default: false },
    blockedIPs: [String],         // list of blocked IPs
    blockedDevices: [String],     // list of blocked device identifiers
    lastLogin: Date,
    ip: String, 
    device: String,
}, { timestamps: true });
module.exports = mongoose.model("User", userSchema);


// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
//     name: String,
//     email: { type: String, unique: true },
//     phone: { type: String, unique: true },
//     password: String,
//     walletBalance: { type: Number, default: 50 }
// }, { timestamps: true });

// module.exports = mongoose.model("User", userSchema);
