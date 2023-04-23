#!/usr/bin/node
const me = process.argv[1]
const port = process.argv[2] || process.env.PORT || 3000

const http = require("http")

const server = http.createServer(handler)
var content = `Server ${me} on port ${port}`

server.listen(port, function () {
    console.log(content + " is running...")
})

process.on('message', ({ hello }) => {
    content = (`${me} received: ${hello}`);
});

function handler(req, res) {
    res.end(content)
}