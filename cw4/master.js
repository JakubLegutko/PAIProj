const child_process = require('child_process');
const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 20150
const CHILD_PORT = parseInt(PORT) + 1
const SLAVE_FILE = './slave.js';
const PUBLIC_DIR = '/public/'

const cp = child_process.fork(SLAVE_FILE, [CHILD_PORT]);

app = express();

const send2child = async (fileName) => {
    cp.send({ fileName: fileName });
};

app.get('/', (_request, response) => {
    const fileName = path.join(PUBLIC_DIR, 'index.html');
    send2child(fileName);
    response.sendFile(fileName);
});

app.get('/*.html', (request, response) => {
    const fileName = path.join(PUBLIC_DIR, request.path);
    send2child(fileName);
    response.sendFile(fileName);
});

app.use(express.static(PUBLIC_DIR));

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
