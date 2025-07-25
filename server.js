// Gerekli kütüphaneler
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

// Kurulum
const app = express();
const server = http.createServer(app);

// GÜNCELLENDİ: Socket.IO için CORS ayarları
const io = new Server(server, {
    cors: {
        origin: "https://benimlobim.site", // SADECE sizin sitenizden gelen isteklere izin ver
        methods: ["GET", "POST"]
    }
});

// GÜNCELLENDİ: Express için CORS ayarları
app.use(cors({
    origin: "https://benimlobim.site"
}));

app.use(express.json());
const PORT = process.env.PORT || 3000; // Render için port ayarı

// Oyunumuzun hafızası: Aktif odaları burada tutacağız
let rooms = {};

// Birisi siteye girdiğinde ve sunucuya bağlandığında
io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı:', socket.id);

    socket.on('joinRoom', (data) => {
        const { roomCode, playerName } = data;
        if (!rooms[roomCode]) {
            rooms[roomCode] = { players: [], spectators: [] };
        }
        const room = rooms[roomCode];
        if (room.players.length >= 2) {
            socket.join(roomCode);
            room.spectators.push({ id: socket.id, name: 'İzleyici' });
            socket.emit('roomState', { message: "Bu oda dolu. İzleyici olarak katıldınız." });
            return;
        }
        socket.join(roomCode);
        const playerInfo = { id: socket.id, name: playerName, score: 0 };
        room.players.push(playerInfo);
        console.log(`Oyuncu ${playerName}, ${roomCode} odasına katıldı. Odadaki oyuncu sayısı: ${room.players.length}`);
        io.to(roomCode).emit('roomState', { message: `${playerName} odaya katıldı. Rakip bekleniyor...`, players: room.players });
        if (room.players.length === 2) {
            console.log(`Oda ${roomCode} dolu. Maç başlatılıyor.`);
            io.to(roomCode).emit('matchStart', room.players);
        }
    });

    socket.on('submitAnswer', (data) => {
        io.to(data.roomCode).emit('answerReceived', data);
    });

    socket.on('disconnect', () => {
        console.log('Bir kullanıcı ayrıldı:', socket.id);
        for (const roomCode in rooms) {
            const room = rooms[roomCode];
            const originalPlayerCount = room.players.length;
            room.players = room.players.filter(p => p.id !== socket.id);
            if (originalPlayerCount === 2 && room.players.length < 2) {
                io.to(roomCode).emit('opponentLeft', { message: "Rakibin ayrıldı." });
            }
        }
    });
});

// Sunucuyu başlat
server.listen(PORT, () => {
    console.log(`Oda Sunucusu ${PORT} portunda çalışıyor...`);
});
