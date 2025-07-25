// Gerekli kütüphaneler
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

// Kurulum
const app = express();
const server = http.createServer(app);

// === CORS AYARLARI (TEK VE DOĞRU YER) ===
// Sunucumuza sadece sizin sitenizden erişim izni veriyoruz.
const corsOptions = {
    origin: "https://benimlobim.site",
    methods: ["GET", "POST"]
};

// Hem Express hem de Socket.IO için aynı ayarları kullanıyoruz.
app.use(cors(corsOptions));
const io = new Server(server, { cors: corsOptions });

// Gelen verileri JSON formatında okuyabilmek için
app.use(express.json());
// Render'ın bize verdiği portu kullanıyoruz.
const PORT = process.env.PORT || 3000;

// Oyunumuzun hafızası: Aktif odaları burada tutacağız
let rooms = {};

// Birisi siteye girdiğinde ve sunucuya bağlandığında
io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı:', socket.id);

    socket.on('joinRoom', (data) => {
        const { roomCode, playerName } = data;
        if (!roomCode || !playerName) { return; }

        if (!rooms[roomCode]) {
            rooms[roomCode] = { players: [], spectators: [] };
        }
        const room = rooms[roomCode];

        if (room.players.some(p => p.id === socket.id)) { return; } // Aynı oyuncu tekrar katılamaz

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

        io.to(roomCode).emit('roomState', {
            message: `${playerName} odaya katıldı. Rakip bekleniyor...`,
            players: room.players
        });

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
