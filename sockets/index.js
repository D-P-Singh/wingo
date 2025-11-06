const socketMiddleware = require('./middleware');
const registerEvents = require('./events');

module.exports = (io) => {
    io.use(socketMiddleware);

    io.on('connection', (socket) => {
        console.log('client connected', socket.id, 'userId=', socket.userId);
        if (socket.userId) socket.join(String(socket.userId));
        registerEvents(socket, io);
    });
};
