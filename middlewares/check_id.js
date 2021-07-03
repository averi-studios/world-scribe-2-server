const validator = require('validator');

module.exports = function (req, res, next) {
    if (req.params.articleId) {
        if (!validator.isAlphanumeric(req.params.articleId)) return res.status(400).end("bad input");
    }
    if (req.params.categoryId) {
        if (!validator.isAlphanumeric(req.params.categoryId)) return res.status(400).end("bad input");
    }
    if (req.params.connectionId) {
        if (!validator.isAlphanumeric(req.params.connectionId)) return res.status(400).end("bad input");
    }
    if (req.params.snippetId) {
        if (!validator.isAlphanumeric(req.params.snippetId)) return res.status(400).end("bad input");
    }
    if (req.params.fieldId) {
        if (!validator.isAlphanumeric(req.params.fieldId)) return res.status(400).end("bad input");
    }
    next();
};
