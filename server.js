const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const ytdl = require('ytdl-core');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

io.on('connection', (socket) => {
    console.log('Пользователь подключен');

    socket.on('download-request', async ({ url, format }) => {
        try {
            const info = await ytdl.getInfo(url);
            const title = info.videoDetails.title.replace(/[/\\?%*:|"<>]/g, '');
            const extension = format === 'video' ? 'mp4' : 'mp3';
            const fileName = `${title}.${extension}`;
            
            socket.emit('video-info', { title, fileName });

            const options = format === 'video' 
                ? { quality: 'highestvideo', filter: 'audioandvideo' } 
                : { quality: 'highestaudio', filter: 'audioonly' };

            const stream = ytdl(url, options);

            stream.on('progress', (chunkLength, downloaded, total) => {
                const percent = (downloaded / total) * 100;
                socket.emit('progress', {
                    percent: percent.toFixed(2),
                    downloaded: (downloaded / 1024 / 1024).toFixed(2),
                    total: (total / 1024 / 1024).toFixed(2)
                });
            });

            const downloadDir = path.join(__dirname, 'downloads');
            if (!fs.existsSync(downloadDir)) {
                fs.mkdirSync(downloadDir);
            }

            const filePath = path.join(downloadDir, fileName);

            stream.pipe(fs.createWriteStream(filePath)).on('finish', () => {
                socket.emit('finished', { fileUrl: `/downloads/${encodeURIComponent(fileName)}` });
            });

        } catch (err) {
            socket.emit('error', 'Ошибка: ' + err.message);
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});
