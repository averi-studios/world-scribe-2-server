const fs = require('fs');
const path = require('path');
const checkId = require('../middlewares/check_id');
const sanitizeBody = require('../middlewares/sanitize_body');
const unescapeBody = require('../utils/unescape_body');

module.exports = function(app) {
    const uploadSinglePicture = require('../middlewares/upload_single_picture')(app);

    // CURL -X POST -H "Content-Type: application/json" -d '{"name":name}' http://localhost:8080/api/categories/
    app.post('/api/categories/', checkId, sanitizeBody, function(req, res, next) {
        app.locals.repository.Category.createCategory(req.body.name)
            .then(function (category) {
                return res.json(category);
            },
                function (error) {
                    console.log(error);
                    return res.status(error.status).send(error.message);
                });
    });

    // CURL -X PUT -H "Content-Type: multipart/form-data" -F "picture=@/path/" http://localhost:8080/api/categories/:categoryId/image/
    app.put('/api/categories/:categoryId/image/', checkId, uploadSinglePicture, function(req, res, next) {
        const categoryId = req.params.categoryId;

        app.locals.repository.Category.getImage(categoryId)
        .then((categoryImageData) => {
            if (categoryImageData) {
                const categoryImagePath = path.join(app.locals.currentWorldFolderPath, 'uploads', categoryImageData.filename);
                try {
                    fs.rmSync(categoryImagePath);
                }
                catch (error) {
                    console.log(`Failed to delete Category image at ${categoryImagePath}. Error:`);
                    console.log(error);
                }
            }

            app.locals.repository.Category.updateCategoryImage(categoryId, req.file)
            .then(function(){
                return res.status(200).end("image has been uploaded for category: " + categoryId);
            })
            .catch((error) => {
                console.log(error);
                return res.status(500).end("internal server error");
            });
        })
        .catch((error) => {
            console.log('Failed to retrieve Category image data during image update. Error:');
            console.log(error);

            app.locals.repository.Category.updateCategoryImage(categoryId, req.file)
            .then(function(){
                return res.status(200).end("image has been uploaded for category: " + categoryId);
            })
            .catch((error) => {
                console.log(error);
                return res.status(500).end("internal server error");
            });
        });
    });

    // CURL http://localhost:8080/api/categories?page=1&size=10
    app.get('/api/categories/', checkId, function(req, res, next) {
        let offset = (parseInt(req.query.page) - 1) * parseInt(req.query.size);
        let limit = parseInt(req.query.size) + 1;
        if (isNaN(offset)) {offset = 0}
        if (isNaN(limit)) {limit = 10}
        app.locals.repository.Category.getCategories(offset, limit)
            .then(function (categories) {
                let hasMore = false;
                if (categories.length == limit){
                    categories.splice(limit-1, 1);
                    hasMore = true;
                }
                let categoryRes = new Set();
                categories.forEach(category => {
                    categoryRes.add(unescapeBody(category.toJSON()));
                });
                let categoriesArray = Array.from(categoryRes);
                let responseJson = {
                    "hasMore" : hasMore,
                    'categories' : categoriesArray
                }
                return res.json(responseJson);
            });
    });

    // CURL http://localhost:8080/api/categories/:categoryId/metadata/
    app.get('/api/categories/:categoryId/metadata/', checkId, function(req, res, next) {
        app.locals.repository.Category.getCategoryMetadata(req.params.categoryId)
            .then(function (metadata) {
                return res.json(unescapeBody(metadata))
            },
                function (error) {
                    return res.status(error.status).end(error.message);
                });
    })

    // CURL http://localhost:8080/api/categories/:categoryId/image/
    app.get('/api/categories/:categoryId/image/', checkId, function(req, res, next) {
        app.locals.repository.Category.getImage(req.params.categoryId)
        .then(function(imageMetadata){
            if (!imageMetadata) {
                return res.status(404).send(`Image does not exist for Category '${req.params.categoryId}'`);
            }
            res.setHeader('Content-Type', imageMetadata.mimetype);
            res.sendFile(path.join(app.locals.currentWorldFolderPath, "uploads", imageMetadata.filename));
        },
        function(error){
            return res.status(error.status).end(error.message);
        });

    });

    // CURL -X PATCH -H "Content-Type: application/json" -d '{"description":"newDescription"}' http://localhost:8080/api/categories/:categoryId/description/
    app.patch('/api/categories/:categoryId/description/', checkId, sanitizeBody, function(req, res, next) {
        app.locals.repository.Category.updateCategoryDescription(req.params.categoryId, req.body.description)
            .then(function (category) {
                return res.json(unescapeBody(category));
            },
                function (error) {
                    // console.log(error.toString());
                    return res.status(error.status).end(error.message);
                });
    });

    // CURL -X DELETE http://localhost:8080/api/categories/:categoryId/
    app.delete('/api/categories/:categoryId/', checkId, function(req, res, next) {
        app.locals.repository.Category.getArticlesInCategory(req.params.categoryId)
        .then((articles) => {
            for (const article of articles) {
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
            }

            app.locals.repository.Category.deleteCategory(req.params.categoryId)
            .then(function (category) {
                if (category.image) {
                    const categoryImageData = JSON.parse(category.image);
                    const categoryImagePath = path.join(app.locals.currentWorldFolderPath, 'uploads', categoryImageData.filename);
                    try {
                        fs.rmSync(categoryImagePath);
                    }
                    catch (error) {
                        console.log(`Failed to delete Category image at ${categoryImagePath}. Error:`);
                        console.log(error);
                    }
                }

                return res.json(category);
            })
            .catch((error) => {
                return res.status(error.status).end(error.message);
            });
        })
        .catch((error) => {
            console.log('Failed to load list of Articles in Category during Category deletion. Error:');
            console.log(error);

            app.locals.repository.Category.deleteCategory(req.params.categoryId)
            .then(function (category) {
                if (category.image) {
                    const categoryImageData = JSON.parse(category.image);
                    const categoryImagePath = path.join(app.locals.currentWorldFolderPath, 'uploads', categoryImageData.filename);
                    try {
                        fs.rmSync(categoryImagePath);
                    }
                    catch (error) {
                        console.log(`Failed to delete Category image at ${categoryImagePath}. Error:`);
                        console.log(error);
                    }
                }

                return res.json(category);
            })
            .catch((error) => {
                return res.status(error.status).end(error.message);
            });
        });
    });
}
