module.exports = function(app) {
    // Normally, we'd just pass app.locals.upload.single('picture') as a middleware to routes that upload files.
    // However, since app.locals.upload can be null, doing that would cause a null error.
    return function(req, res, next) {
        if (app.locals.upload) {
            app.locals.upload.single('picture')(req, res, next);
        } else {
            next();
        }
    }
}
