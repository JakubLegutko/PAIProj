#!/usr/bin/node
const express = require("express")

const port = process.argv[2] || process.env.PORT || 3000
const PUBLIC_DIR = '/public/'

let fileToDisplay = '/public/index.html';
const app = express();

process.on('message', ({ fileName }) => {
    console.log(`Slave is displaying ${fileName}...`);
    fileToDisplay = `${fileName}`;
});

app.get("/", (_request, response) => {
    response.sendFile(fileToDisplay);
});

app.use(express.static(PUBLIC_DIR));

app.listen(port, () => {
    console.log(`The slave server is running on port ${port}`)
});
