#!/usr/bin/node
const http = require("http");

const server = http.createServer(handler);

server.listen(20150, function(){
    console.log("Server is running...")
    });

function handler(req, res){
    res.end("Hello, World!")
}
console.log("Got this point");