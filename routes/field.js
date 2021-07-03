const checkId = require('../middlewares/check_id');
const sanitizeBody = require('../middlewares/sanitize_body');
const unescapeBody = require('../utils/unescape_body');

module.exports = function(app) {
    // CURL -X POST -H "Content-Type: application/json" -d '{"name":"name"}' http://localhost:8080/api/categories/:categoryId/fields/
    app.post('/api/categories/:categoryId/fields/', checkId, sanitizeBody, function(req, res, next) {
        app.locals.repository.Field.createField(req.params.categoryId, req.body.name)
            .then(function (field) {
                return res.json(field);
            },
                function (error) {
                    return res.status(error.status).end(error.message);
                });
    });

    // CURL http://localhost:8080/api/articles/:articleId/fields?page=1&size=10
    app.get('/api/articles/:articleId/fields/', checkId, function(req, res, next) {
        let offset = (parseInt(req.query.page) - 1) * parseInt(req.query.size);
        let limit = parseInt(req.query.size) + 1;
        if (isNaN(offset)) {offset = 0};
        if (isNaN(limit)) {limit = 10};
        app.locals.repository.Article.getFields(req.params.articleId, offset, limit)
            .then(function (fields) {
                let hasMore = false;
                if (fields.length == limit){
                    fields.splice(limit-1, 1);
                    hasMore = true;
                }
                let fieldRes = new Set();
                fields.forEach(field => {
                    fieldRes.add(unescapeBody(field));
                });
                let fieldsArray = Array.from(fieldRes);
                let responseJson = {
                    "hasMore" : hasMore,
                    'fields' : fieldsArray
                }
                return res.json(responseJson);
            },
                function (error) {
                    // console.log(error.toString());
                    return res.status(500).end("internal server error");
                });
    });

    // CURL -b cookie.txt -X POST -H "Content-Type: application/json" -d '{"value":"value"}' http://localhost:8080/api/articles/:articleId/fields/:fieldId/
    app.patch('/api/articles/:articleId/fields/:fieldId/', checkId, sanitizeBody, function(req, res, next) {
        let articleId = req.params.articleId;
        let fieldId = req.params.fieldId;
        app.locals.repository.Article.updateField(articleId, fieldId, req.body.value)
            .then(function (field) {
                return res.json(unescapeBody(field));
            },
                function (error) {
                    // console.log(error.toString());
                    return res.status(500).end("internal server error");
                });
    });

    // CURL http://localhost:8080/api/categories/:categoryId/fields?page=1&size=10
    app.get('/api/categories/:categoryId/fields/', checkId, function(req, res, next) {
        let offset = (parseInt(req.query.page) - 1) * parseInt(req.query.size);
        let limit = parseInt(req.query.size) + 1;
        if (isNaN(offset)) {offset = 0}
        if (isNaN(limit)) {limit = 10}
        app.locals.repository.Field.getFieldsInCategory(req.params.categoryId, offset, limit)
            .then(function (fields) {
                let hasMore = false;
                if (fields.length == limit){
                    fields.splice(limit-1, 1);
                    hasMore = true;
                }
                let fieldRes = new Set();
                fields.forEach(field => {
                    fieldRes.add(unescapeBody(field));
                });
                let fieldsArray = Array.from(fieldRes);
                let responseJson = {
                    "hasMore" : hasMore,
                    'fields' : fieldsArray
                }
                return res.json(responseJson);
            },
                function (error) {
                    return res.status(error.status).end(error.message);
                });
    });

    // CURL -X PATCH -H "Content-Type: application/json" -d '{"name":"newName"}' http://localhost:8080/api/categories/:categoryId/fields/:fieldId/name/
    app.patch('/api/categories/:categoryId/fields/:fieldId/name/', checkId, sanitizeBody, function(req, res, next) {
        app.locals.repository.Field.renameField(req.params.fieldId, req.body.name)
            .then(function (field) {
                return res.json(unescapeBody(field.toJSON()));
            },
                function (error) {
                    // console.log(error.toString());
                    return res.status(error.status).end(error.message);
                });
    });

    // CURL -X DELETE http://localhost:8080/api/categories/:categoryId/fields/:fieldId/
    app.delete('/api/categories/:categoryId/fields/:fieldId/', checkId, function(req, res, next) {
        app.locals.repository.Field.deleteField(req.params.fieldId)
            .then(function (field) {
                return res.json(field);
            },
                function (error) {
                    // console.log(error.toString());
                    return res.status(error.status).end(error.message);
                });
    });
}
