const checkId = require('../middlewares/check_id');
const sanitizeBody = require('../middlewares/sanitize_body');
const unescapeBody = require('../utils/unescape_body');

module.exports = function(app) {
    // CURL -X POST -H "Content-Type: application/json" -d '{"otherArticleId":1}' http://localhost:8080/api/articles/1/connections/
    app.post('/api/articles/:articleId/connections/', checkId, sanitizeBody, function(req, res, next) {
        app.locals.repository.Connection.createConnection(req.params.articleId, req.body.otherArticleId)
            .then(function (connection) {
                return res.json(connection);
            },
                function (error) {
                    console.log(error.toString());
                    return res.status(500).end("internal server error");
                });
    });

    app.get('/api/articles/:articleId/connections/', checkId, function(req, res, next) {
        let offset = (parseInt(req.query.page) - 1) * parseInt(req.query.size);
        let limit = parseInt(req.query.size) + 1;
        if (isNaN(offset)) {offset = 0};
        if (isNaN(limit)) {limit = 10};
        app.locals.repository.Article.getConnections(req.params.articleId, offset, limit)
            .then(function (connections) {
                let hasMore = false;
                if (connections.length == limit){
                    connections.splice(limit-1, 1);
                    hasMore = true;
                }
                let connectionRes = new Set();
                connections.forEach(connection => {
                    connectionRes.add(unescapeBody(connection.toJSON()));
                });
                let connectionsArray = Array.from(connectionRes);
                let responseJson = {
                    "hasMore" : hasMore,
                    'connections' : connectionsArray
                }
                return res.json(responseJson);
            },
                function (error) {
                    console.log(error.toString());
                    return res.status(500).end("internal server error");
                });
    });

    app.get('/api/articles/:articleId/connections/available/', checkId, function(req, res, next) {
        app.locals.repository.Connection.getAvailableArticlesForConnection(req.params.articleId)
            .then(function (availableArticlesByCategory) {
                /*
                let availableArticlesRes = new Set();
                availableArticles.forEach(availableArticle => {
                    availableArticlesRes.add(unescapeBody(availableArticle));
                });
                return res.json(Array.from(availableArticlesRes));
                */
                for (let i = 0; i < availableArticlesByCategory.length; i++) {
                    let currentCategory = availableArticlesByCategory[i];
                    for (let j = 0; j < currentCategory.articles.length; j++) {
                        currentCategory.articles[j] = unescapeBody(currentCategory.articles[j]);
                    }
                    availableArticlesByCategory[i] = unescapeBody(currentCategory);
                }
                return res.json(availableArticlesByCategory);
            },
                function (error) {
                    console.log(error.toString());
                    return res.status(500).end("internal server error");
                });
    });

    app.get('/api/articles/:articleId/connections/:connectionId/', checkId, function(req, res, next) {
        app.locals.repository.Connection.getConnection(req.params.connectionId)
            .then(function (connection) {
                return res.json(unescapeBody(connection));
            },
                function (error) {
                    console.log(error.toString());
                    return res.status(500).end("internal server error");
                });
    });

    // CURL -X PATCH -H "Content-Type: application/json" -d '{"mainArticleRole":"Role 1", "otherArticleRole": "Role 2", "description":"Description"}' http://localhost:8080/api/articles/1/connections/1/
    app.patch('/api/articles/:articleId/connections/:connectionId/', checkId, sanitizeBody, function(req, res, next) {
        app.locals.repository.Connection.updateConnection(req.params.connectionId, req.body.mainArticleRole, req.body.otherArticleRole, req.body.description)
            .then(function (connection) {
                return res.json(unescapeBody(connection));
            },
                function (error) {
                    console.log(error.toString());
                    return res.status(500).end("internal server error");
                });
    });

    // CURL -X DELETE http://localhost:8080/api/articles/:articleId/connections/:connectionId/
    app.delete('/api/articles/:articleId/connections/:connectionId/', checkId, function(req, res, next) {
        app.locals.repository.Connection.deleteConnection(req.params.articleId, req.params.connectionId)
            .then(function (connection) {
                return res.json(connection);
            },
                function (error) {
                    // console.log(error.toString());
                    return res.status(error.status).end(error.message);
                });
    });
}
