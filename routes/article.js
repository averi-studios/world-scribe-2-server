const fs = require('fs');
const path = require('path');
const checkId = require('../middlewares/check_id');
const sanitizeBody = require('../middlewares/sanitize_body');
const unescapeBody = require('../utils/unescape_body');

module.exports = function(app) {
    const uploadSinglePicture = require('../middlewares/upload_single_picture')(app);

    // CURL -X POST -H "Content-Type: application/json" -d '{"name":"name", "categoryId":"categoryid"}' http://localhost:8080/api/articles/
    app.post('/api/articles/', checkId, sanitizeBody, function(req, res, next) {
        app.locals.repository.Article.createArticle(req.body.name, req.body.categoryId)
            .then(function (article) {
                return res.json(article.toJSON());
            },
                function (error) {
                    // console.log(error.toString());
                    return res.status(500).end("internal server error");
                });
    });

    // CURL -X PUT -H "Content-Type: multipart/form-data" -F "picture=@/path/" http://localhost:8080/api/articles/:articleId/image/
    app.put('/api/articles/:articleId/image/', checkId, uploadSinglePicture, function(req, res, next) {
        const articleId = req.params.articleId;

        app.locals.repository.Article.getImage(articleId)
        .then((articleImageData) => {
            if (articleImageData) {
                const articleImagePath = path.join(app.locals.currentWorldFolderPath, 'uploads', articleImageData.filename);
                try {
                    fs.rmSync(articleImagePath);
                }
                catch (error) {
                    console.log(`Failed to delete Article image at ${articleImagePath}. Error:`);
                    console.log(error);
                }
            }

            app.locals.repository.Article.updateImage(articleId, req.file)
            .then(function(){
                return res.status(200).end("image has been uploaded for article: " + articleId);
            })
            .catch((error) => {
                console.log(error);
                return res.status(500).end("internal server error");
            });
        })
        .catch((error) => {
            console.log('Failed to retrieve Article image data during image update. Error:');
            console.log(error);

            app.locals.repository.Article.updateImage(articleId, req.file)
            .then(function(){
                return res.status(200).end("image has been uploaded for article: " + articleId);
            })
            .catch((error) => {
                console.log(error);
                return res.status(500).end("internal server error");
            });
        });

    });

    // CURL http://localhost:8080/api/articles?page=1&size=10
    app.get('/api/articles/', checkId, function(req, res, next) {
        let offset = (parseInt(req.query.page) - 1) * parseInt(req.query.size);
        let limit = parseInt(req.query.size) + 1;
        if (isNaN(offset)) {offset = 0};
        if (isNaN(limit)) {limit = 10};
        app.locals.repository.Article.getArticlesInWorld(offset, limit)
            .then(function (articles) {
                let hasMore = false;
                if (articles.length == limit){
                    articles.splice(limit-1, 1);
                    hasMore = true;
                }
                let articledRes = new Set();
                articles.forEach(article => {
                    articledRes.add(unescapeBody(article.toJSON()));
                });
                let articlesArray = Array.from(articledRes);
                let responseJson = {
                    "hasMore" : hasMore,
                    'articles' : articlesArray
                }
                return res.json(responseJson);
            },
                function (error) {
                    // console.log(error.toString());
                    return res.status(500).end("internal server error");
                });
    });

    app.get('/api/articles/:articleId/metadata/', checkId, function(req, res, next) {
        app.locals.repository.Article.getArticleMetadata(req.params.articleId)
            .then(function (metadata) {
                return res.json(unescapeBody(metadata));
            },
                function (error) {
                    console.log(error.toString());
                    return res.status(500).end("internal server error");
                });
    });

    app.get('/api/articles/:articleId/image/', checkId, function(req, res, next) {
        app.locals.repository.Article.getImage(req.params.articleId)
        .then(function(imageMetadata){
            if (!imageMetadata) {
                return res.status(404).send(`Image does not exist for Article '${req.params.articleId}'`);
            }
            res.setHeader('Content-Type', imageMetadata.mimetype);
            res.sendFile(path.join(app.locals.currentWorldFolderPath, "uploads", imageMetadata.filename));
        },
        function(error){
            console.log(error.toString());
            return res.status(500).end("internal server error");
        });
    });

    // CURL http://localhost:8080/api/categories/:categoryId/articles?page=1&size=10
    app.get('/api/categories/:categoryId/articles/', checkId, function(req, res, next) {
        let offset = (parseInt(req.query.page) - 1) * parseInt(req.query.size);
        let limit = parseInt(req.query.size) + 1;
        if (isNaN(offset)) {offset = 0}
        if (isNaN(limit)) {limit = 10}
        app.locals.repository.Category.getArticlesInCategory(req.params.categoryId, offset, limit)
            .then(function (articles) {
                hasMore = false;
                if(articles.length == limit){
                    hasMore = true;
                    articles.splice(limit-1, 1);
                }
                let resArticles = new Set();
                articles.forEach(article => {
                    resArticles.add(unescapeBody(article));
                });
                articlesArray = Array.from(resArticles)
                responseJson = {
                    'hasMore' : hasMore,
                    'articles' : articlesArray
                }
                return res.json(responseJson);
            },
                function (error) {
                    return res.status(error.status).end(error.message);
                });
    });

    // CURL --request PATCH 'http://localhost:49000/api/articles/1/rename' --header 'Content-Type: application/json' --data-raw '{ "name": "The Boy" }'
    app.patch('/api/articles/:articleId/rename', checkId, function(req, res, next) {
        app.locals.repository.Article.renameArticle(req.params.articleId, req.body.name)
            .then(function (article) {
                return res.json(article);
            },
                function (error) {
                    // console.log(error.toString());
                    return res.status(error.status).end(error.message);
                });
    });

    // CURL -X DELETE http://localhost:8080/api/articles/:articleId/
    app.delete('/api/articles/:articleId/', checkId, function(req, res, next) {
        app.locals.repository.Article.deleteArticle(req.params.articleId)
            .then(function (article) {
                if (article.image) {
                    const articleImageData = JSON.parse(article.image);
                    const articleImagePath = path.join(app.locals.currentWorldFolderPath, 'uploads', articleImageData.filename);
                    try {
                        fs.rmSync(articleImagePath);
                    }
                    catch (error) {
                        console.log(`Failed to delete Article image at ${articleImagePath}. Error:`);
                        console.log(error);
                    }
                }

                return res.json(article);
            },
                function (error) {
                    // console.log(error.toString());
                    return res.status(error.status).end(error.message);
                });
    });
}
