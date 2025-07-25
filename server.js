// Gerekli kütüphaneler
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

// Kurulum
const app = express();
const server = http.createServer(app);

// GÜNCELLENDİ: Socket.IO için CORS ayarları
// Artık sadece sizin sitenizden gelen bağlantılara izin verilecek.
const io = new Server(server, {
app.use(cors({
    origin: "https://benimlobim.site"
}));

// GÜNCELLENDİ: Express için CORS ayarları
// Bu satırı da güncelleyerek izni pekiştirdik.
app.use(cors({
    origin: "https://benimlobim.site"
}));

app.use(express.json());
const PORT = 3000;

// Oyunumuzun hafızası: Aktif odaları burada tutacağız
let rooms = {};

// Birisi siteye girdiğinde ve sunucuya bağlandığında
io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı:', socket.id);

    // Bir oyuncu bir odaya katılmak istediğinde
    socket.on('joinRoom', (data) => {
        const { roomCode, playerName } = data;
        
        // Odayı bul veya oluştur
        if (!rooms[roomCode]) {
            rooms[roomCode] = { players: [], spectators: [] };
        }
        
        const room = rooms[roomCode];

        // Eğer oda doluysa, izleyici olarak ekle
        if (room.players.length >= 2) {
            socket.join(roomCode);
            room.spectators.push({ id: socket.id, name: 'İzleyici' });
            socket.emit('roomState', { message: "Bu oda dolu. İzleyici olarak katıldınız." });
            return;
        }

        // Oyuncuyu odaya ekle
        socket.join(roomCode);
        const playerInfo = {
            id: socket.id,
            name: playerName,
            score: 0
        };
        room.players.push(playerInfo);
        console.log(`Oyuncu ${playerName}, ${roomCode} odasına katıldı. Odadaki oyuncu sayısı: ${room.players.length}`);

        // Odaya yeni durumu bildir
        io.to(roomCode).emit('roomState', {
            message: `${playerName} odaya katıldı. Rakip bekleniyor...`,
            players: room.players
        });

        // Eğer oda dolduysa, maçı başlat
        if (room.players.length === 2) {
            console.log(`Oda ${roomCode} dolu. Maç başlatılıyor.`);
            io.to(roomCode).emit('matchStart', room.players);
        }
    });

    // Oyuncudan cevap geldiğinde
    socket.on('submitAnswer', (data) => {
        // Gelen cevabı odadaki herkese geri gönder (ana ekran bunu işleyecek)
        io.to(data.roomCode).emit('answerReceived', data);
    });

    // Oyuncu bağlantıyı kestiğinde
    socket.on('disconnect', () => {
        console.log('Bir kullanıcı ayrıldı:', socket.id);
        // Kullanıcının olduğu odayı bul ve temizle (opsiyonel, geliştirilebilir)
        for (const roomCode in rooms) {
            const room = rooms[roomCode];
            const originalPlayerCount = room.players.length;
            room.players = room.players.filter(p => p.id !== socket.id);
            
            // Eğer odada bir oyuncu ayrıldıysa ve artık 2'den az oyuncu varsa
            if (originalPlayerCount === 2 && room.players.length < 2) {
                io.to(roomCode).emit('opponentLeft', { message: "Rakibin ayrıldı." });
            }
        }
    });
});

// Sunucuyu başlat
server.listen(PORT, () => {
    console.log(`Oda Sunucusu http://localhost:${PORT} adresinde çalışıyor...`);
});
