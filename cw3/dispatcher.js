#!/usr/bin/node
const port = process.env.PORT || 20151
const argv = process.argv
const proc = require("child_process")
const argc = argv.length
const http = require("http");
const fs = require("fs");

// create server
const server = http.createServer((req, res) => {
    if (req.url === "/index.html") {
        // serve code.html file
        fs.readFile("code.html", (err, data) => {
            if (err) {
                res.writeHead(500, {"Content-Type": "text/plain"});
                res.end("500 Internal Server Error");
            } else {
                res.writeHead(200, {"Content-Type": "text/html"});
                res.end(data);
            }
        });
    }
});
// listen on port
server.listen(20150, () => {
    console.log(`Server running at`);
});
if (argc < 3) {
    console.log("Nie podano nazwy skryptu do uruchomienia")
}
else for (var i = 2, p = 20151; i < argc; i++, p++) {
    const child = proc.fork(`./${argv[i]}`, [p])
    child.on('data', (data) => {
        console.log(`${data}`)
    });

    setInterval(() => {
        child.send({ hello: "Message from the dispatcher!" })
        console.log("message sent");
    }, 5000);

    
    setInterval(() => {
        child.send({ hello: "I'm doing my part!" })
        console.log("message sent");
    }, 4000);

    child.on('error', (data) => {
        console.error(`stderr: ${data}`);
    })
    child.on('close', (code) => {
        console.log(`child process exited with code ${code}`)
    })
}