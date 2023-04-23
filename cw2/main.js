#!/usr/bin/node
const rootDir = '/var/www/html';

const port = process.argv[2] || process.env.PORT || 80

console.log(port);

const http = require("http");
var url = require('url');
const fs = require('fs');

const server = http.createServer(handler);

server.listen(port, function () {
  console.log("Server is running on port " + port);
});

function handler(req, res) {
  var url_parts = url.parse(req.url)
  console.log(req.url);
  var filePath = rootDir + url_parts.pathname

  var logData = `Zażądano dostępu do pliku ${filePath}`;

  fs.writeFile("app.log", logData + "\n", { flag: "a" }, (err) => {
    if (err)
      console.log(err)
    else
      console.log(logData)
  });

  fs.readFile(filePath, (err, data) => {
    if (err)
      res.end("Brak zasobu lub dostępu")
    else
      res.end(data)
  })
}