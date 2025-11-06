const jwt = require('jsonwebtoken');

module.exports = (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.isAdmin = decoded.isAdmin || false;
        next();
    } catch (err) {
        next();
    }
};
