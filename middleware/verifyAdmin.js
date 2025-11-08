const jwt = require('jsonwebtoken');
module.exports = function (req, res, next) {
    console.log("middlewaew");
    const header = req.headers.authorization;
    console.log("header",header);
    if (!header) return res.status(401).json({ msg: 'No token' });
    const parts = header.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ msg: 'Invalid token format' });
    const token = parts[1];
    try {
        const decoded = jwt.verify(token, "dev");

        req.admin.id = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ msg: 'Invalid token' });
    }
};


const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Assuming User model has `isAdmin` field

const verifyAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
        return res.status(401).json({ message: "Access denied. No token provided." });

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, "dev");
        const user = await User.findById(decoded.id);

        if (!user) return res.status(401).json({ message: "User not found." });
        if (!user.isAdmin) return res.status(403).json({ message: "Access denied. Admins only." });

        req.admin = user; // attach admin info to request
        next();
    } catch (err) {
        res.status(400).json({ message: "Invalid token." });
    }
};

module.exports = verifyAdmin;
