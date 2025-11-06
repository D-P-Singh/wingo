const jwt = require('jsonwebtoken');
const { head } = require('../routes/wallet_routes');

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
        req.user = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ msg: 'Invalid token' });
    }
};


/* import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "No token" });

    try {
        const decoded = jwt.verify(token, "SECRET");
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: "Invalid token" });
    }
};
 */