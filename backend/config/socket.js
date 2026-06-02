const socketIo = require('socket.io');

const initSocket = (server) => {
    const io = socketIo(server, { cors: { origin: "*" } });

    let timer = 30; // ගේම් ටයිමර් එක (තත්පර 30)

    setInterval(() => {
        timer--;

        // ටයිමර් එක 0 වුණාම ඩයිස් එක රෝල් වෙන්න ඕනේ
        if (timer <= 0) {
            const result = Math.floor(Math.random() * 6) + 1;
            io.emit('game_result', { result }); // හැමෝටම රිසල්ට් එක යවනවා
            timer = 30; // ආයෙත් ටයිමර් එක පටන් ගන්නවා
        }

        // හැමෝටම ටයිමර් එකේ ඉතිරි තත්පර ගණන යවනවා
        io.emit('timer', { timer });
    }, 1000);

    io.on('connection', (socket) => {
        console.log('User connected to live game:', socket.id);
    });

    return io;
};

module.exports = initSocket;