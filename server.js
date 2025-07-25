// Gerekli kütüphaneleri projemize dahil ediyoruz
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

// Express uygulamasını oluşturuyoruz
const app = express();
// HTTP sunucusunu oluşturuyoruz
const server = http.createServer(app);
// Socket.IO'yu sunucumuza bağlıyoruz (gerçek zamanlı iletişim için)
const io = new Server(server, {
    cors: {
        origin: "*", // Her yerden gelen isteklere izin ver (test için)
    }
});

// Gelen verileri JSON formatında okuyabilmek için
app.use(express.json());
// CORS hatalarını önlemek için
app.use(cors());

const PORT = 3000; // Sunucumuzun çalışacağı kapı (port)

// Ana dizin: Sunucunun çalışıp çalışmadığını kontrol etmek için
app.get('/', (req, res) => {
    res.send('1vs1 Sunucusu başarıyla çalışıyor!');
});

// TİKTOK WEBHOOK ADRESİ: TikFinity bu adrese veri gönderecek
app.post('/tiktok-olayi', (req, res) => {
    // TikFinity'den gelen veri req.body içinde olacak
    const gelenVeri = req.body;
    
    // Gelen veriyi sunucunun konsoluna yazdırıyoruz
    console.log("---------------------------------");
    console.log("TikFinity'den bir olay geldi!");
    console.log(gelenVeri);
    console.log("---------------------------------");

    // TikFinity'e "veriyi aldım, sorun yok" mesajı gönderiyoruz
    res.sendStatus(200);
});


// Bir kullanıcı websitemize bağlandığında bu kod çalışacak
io.on('connection', (socket) => {
    console.log('Bir kullanıcı siteye bağlandı:', socket.id);
});


// Sunucuyu dinlemeye başlıyoruz
server.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor...`);
});