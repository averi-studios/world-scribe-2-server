module.exports = function(corsAllowList, logFunctions) {
    // Redirect logs to another logging service, such as electron-log.
    if (logFunctions) {
        Object.assign(console, logFunctions);
    }

    require('dotenv').config();

    const express = require('express');
    const app = express();

    const bodyParser = require('body-parser');
    app.use(bodyParser.json());

    const cors = require('cors');
    const serverCors = cors({
        origin: corsAllowList,
        credentials: true
    });
    app.use(serverCors);

    // Dummy handler for top-level route '/'.
    // The concurrently package (used in the desktop app) needs this, as it will not deem a port "ready" until it returns a 200 response.
    app.get('/', function (req, res, next) {
        return res.status(200).json({ message: "World Scribe server is running" });
    });

    // These are GLOBAL server variables that can be accessed from any route.
    app.locals.upload = null; // multer instance for file upload
    app.locals.currentWorldFolderPath = null; // Filepath to the World that the client has currently opened
    app.locals.repository = null; // An instance of ./database/repository.js, containing functions for database operations

    require('./routes/world')(app);

    app.use(function(req, res, next) {
        if (!app.locals.currentWorldFolderPath || !app.locals.upload || !app.locals.repository) {
            return res.status(400).json({message: "Server is not connected to a World. Please configure the World connection using the POST /api/worldAccesses endpoint."});
        }
        else {
            next();
        }
    });

    require('./routes/category')(app);
    require('./routes/article')(app);
    require('./routes/field')(app);
    require('./routes/connection')(app);
    require('./routes/snippet')(app);

    const http = require('http');
    let port = 49000;

    http.createServer(app).listen(port, function (err) {
        if (err) console.log(err);
        console.log(`World Scribe 2 Server is now running at http://localhost:${port}`);
    });
}
