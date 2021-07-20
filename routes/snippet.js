const checkId = require('../middlewares/check_id');
const sanitizeBody = require('../middlewares/sanitize_body');
const unescapeBody = require('../utils/unescape_body');

module.exports = function(app) {
    // CURL -X POST -H "Content-Type: application/json" -d '{"name":"name"}' http://localhost:8080/api/articles/1/snippets/
    app.post('/api/articles/:articleId/snippets/', checkId, sanitizeBody, function(req, res, next) {
        app.locals.repository.Article.createSnippet(req.params.articleId, req.body.name)
            .then(function (snippet) {
                return res.json(snippet.toJSON());
            },
                function (error) {
                    console.log(error.toString());
                    return res.status(500).end("internal server error");
                });
    });

    app.get('/api/articles/:articleId/snippets/', checkId, function(req, res, next) {
        let offset = (parseInt(req.query.page) - 1) * parseInt(req.query.size);
        let limit = parseInt(req.query.size) + 1;
        if (isNaN(offset)) {offset = 0};
        if (isNaN(limit)) {limit = 10};
        app.locals.repository.Article.getSnippets(req.params.articleId, offset, limit)
            .then(function (snippets) {
                let hasMore = false;
                if (snippets.length == limit){
                    snippets.splice(limit-1, 1);
                    hasMore = true;
                }
                let snippetRes = new Set();
                snippets.forEach(snippet => {
                    snippetRes.add(unescapeBody(snippet.toJSON()));
                });
                let snippetsArray = Array.from(snippetRes);
                let responseJson = {
                    "hasMore" : hasMore,
                    'snippets' : snippetsArray
                }
                return res.json(responseJson);
            },
                function (error) {
                    // console.log(error.toString());
                    return res.status(500).end("internal server error");
                });
    });

    app.get('/api/articles/:articleId/snippets/:snippetId/content/', checkId, function(req, res, next) {
        app.locals.repository.Snippet.getSnippet(req.params.snippetId)
            .then(function (snippet) {
                snippetJson = unescapeBody(snippet.toJSON())
                contentRes = { content: snippetJson.content };
                return res.json(contentRes);
            },
                function (error) {
                    // console.log(error.toString());
                    return res.status(500).end("internal server error");
                });
    });

    // CURL -X PATCH -H "Content-Type: application/json" -d '{"content":"New Content"}' http://localhost:8080/api/articles/1/snippets/1/content/
    app.patch('/api/articles/:articleId/snippets/:snippetId/content/', checkId, sanitizeBody, function(req, res, next) {
        app.locals.repository.Snippet.updateSnippet(req.params.snippetId, req.body.content)
            .then(function (snippet) {
                return res.json(unescapeBody(snippet.toJSON()));
            },
                function (error) {
                    console.log(error.toString());
                    return res.status(500).end("internal server error");
                });
    });

    // CURL --request PATCH 'http://localhost:49000/api/snippets/1/name' --header 'Content-Type: application/json' --data-raw '{ "name": "escape" }'
    app.patch('/api/articles/:articleId/snippets/:snippetId/name', checkId, function (req, res, next) {
        app.locals.repository.Snippet.renameSnippet(
            req.params.articleId,
            req.params.snippetId,
            req.body.name
        ).then(
            function (snippet) {
                return res.json(snippet);
            },
            function (error) {
                //console.log(error.toString());
                return res.status(error.status).end(error.message);
            }
        );
    }
    );

    // CURL -X DELETE http://localhost:8080/api/articles/:articleId/snippets/:snippetId/
    app.delete('/api/articles/:articleId/snippets/:snippetId/', checkId, function(req, res, next) {
        app.locals.repository.Snippet.deleteSnippet(req.params.articleId, req.params.snippetId)
            .then(function (snippet) {
                return res.json(snippet);
            },
                function (error) {
                    // console.log(error.toString());
                    return res.status(error.status).end(error.message);
                });
    });
}
