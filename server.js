const { createServer } = require("http");
const { appendFile } = require("fs");
const path = require("path");
const { EventEmitter } = require("events");

const NewsLetter = new EventEmitter();

const server = createServer((req, res) => {
    const chunks = [];
    const { url, method } = req;

    req.on("error", (err) => {
        console.log(err);
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify({ msg: "Invalid request" }));
        res.end();
    });

    res.on("error", (err) => {
        console.log(err);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify({ msg: "Server error" }));
        res.end();
    });

    req.on("data", (chunk) => {
        chunks.push(chunk);
    });
    req.on("end", () => {
        if (url === "/newsletter_signup" && method === "POST") {

            const body = JSON.parse(Buffer.concat(chunks).toString());

            const newContact = `${body.name},${body.email}\n`;

            NewsLetter.emit("signup", newContact, res);

            res.setHeader("Content-Type", "application/json");
            res.write(JSON.stringify({ msg: "Successfully signed up" }));
            res.end();
        } else { 
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.write(JSON.stringify({ msg: "Invalid entry" }));
            res.end();
        }
    });
});

server.listen(3000, () => console.log("Server listening"));

NewsLetter.on("signup", (newContact, res) => {
    
    appendFile(
        path.join(__dirname, "/newsletter.csv"), 
        newContact, 
        (err) => {
            if (err) {
                NewsLetter.emit("error", err, res);
                return;
            }
            console.log("Update was successful!");
        }
    );
});

NewsLetter.on("error", (err) => {
    console.log(err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify({ msg: "Error occurred during sign up" }));
    res.end();
});