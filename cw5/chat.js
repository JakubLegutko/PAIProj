const bodyParser = require("body-parser");
const express = require('express');
const path = require('path');
const cors = require('cors');

const PORT =  20150;
const IP = '149.156.43.57';

const app = express();
app.set("view engine", "hbs");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use('/static', express.static(path.join(__dirname, 'public')));

const ENTRIES = [];

const main = (request, response) => {
    response.redirect('form');
};

const getForm = (request, response) => {
    const entries = formatEntries();
    response.render("index", {
        action: "#",
        method: "post",
        loader: "Loading...",
        empty: entries.length === 0,
        endpoint: `http://${IP}/${PORT}`
    });
};

const postForm = (request, response) => {
    addEntry({
        date: new Date().toLocaleString('pl-PL'),
        user: require("os").userInfo().username,
        host: request.headers.host,
        message: request.body.message,
    });
    response.sendStatus(200);
};

const getEntries = (request, response) => {
    response.send(formatEntries());
};

const formatEntries = () => {
    return ENTRIES.map((entry) => {
        const payload = {
            date: entry.date,
            host: entry.host,
            user: entry.user,
            message: entry.message,
        }
        return payload;
    });
}

const addEntry = (entry) => {
    ENTRIES.push(entry);
};


app.get("/", main);
app.get("/form", getForm);
app.post("/form", postForm);
app.get("/entries", getEntries)


var server = app.listen(PORT, () => {
    console.log(`Starting server on ${PORT}...`);
});
