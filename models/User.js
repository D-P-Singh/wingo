const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    password: String,
    walletBalance: { type: Number, default: 50 }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
