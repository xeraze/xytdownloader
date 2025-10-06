const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');

function sanitizeFileName(title) {
    return title
        .replace(/[/\\?%*:|"<>]/g, '')
        .trim();
}

async function downloadMedia(url, format) {
    try {
        const info = await ytdl.getInfo(url);
        const title = sanitizeFileName(info.videoDetails.title);
        let outputFilePath;

        const filterOptions = format === 'video' 
            ? { quality: 'highestvideo' }
            : { quality: 'highestaudio' };

        const extension = format === 'video' ? 'mp4' : 'mp3';
        outputFilePath = path.join(process.cwd(), `${title}.${extension}`);

        console.log(`\n--- Информация о видео ---`);
        console.log(`Название: ${title}`);
        console.log(`Формат: ${format.toUpperCase()}`);
        console.log(`Файл: ${outputFilePath}`);
        console.log(`--------------------------\n`);
        console.log('Начинается скачивание...');
        
        const stream = ytdl(url, filterOptions);
        
        stream.pipe(fs.createWriteStream(outputFilePath));

        stream.on('progress', (chunkLength, downloaded, total) => {
            const percent = (downloaded / total) * 100;
            process.stdout.write(`\r[${(downloaded / 1024 / 1024).toFixed(2)}MB / ${(total / 1024 / 1024).toFixed(2)}MB] - ${percent.toFixed(2)}%`);
        });

        stream.on('end', () => {
            console.log(`\n\n✅ Скачивание завершено! Файл сохранен как ${outputFilePath}`);
        });

        stream.on('error', (err) => {
            console.error('\n\n❌ Ошибка скачивания:', err.message);
        });

    } catch (err) {
        console.error('\n❌ Не удалось обработать ссылку или найти видео. Проверьте URL.', err.message);
    }
}

async function runDownloader() {
    console.log(`\n--- YouTube CLI Downloader (Node.js) ---`);
    console.log(`Автор: xeraze`);
    console.log(`----------------------------------------`);
    
    const { url } = await inquirer.prompt([
        {
            type: 'input',
            name: 'url',
            message: 'Введите ссылку на YouTube видео:',
            validate: input => ytdl.validateURL(input) || 'Пожалуйста, введите корректный URL YouTube.'
        }
    ]);

    const { format } = await inquirer.prompt([
        {
            type: 'list',
            name: 'format',
            message: 'Выберите формат скачивания:',
            choices: [
                { name: 'Видео (.mp4)', value: 'video' },
                { name: 'Аудио (.mp3)', value: 'audio' }
            ]
        }
    ]);

    await downloadMedia(url, format);
}

runDownloader();
