const validator = require('validator');

module.exports = function (req, res, next) {
    if (req.body.name) {
        req.body.name = validator.escape(req.body.name);
    }
    /*
    having tough time sanitizing int
    if(req.body.categoryId){
        if (!validator.isNumeric(req.body.categoryId)) return res.status(400).end("bad input");
        req.body.categoryId = validator.toInt(req.body.categoryId);
    }
    if(req.body.otherArticleId){
        if (!validator.isNumeric(req.body.otherArticleId)) return res.status(400).end("bad input");
        req.body.otherArticleId = validator.toInt(req.body.otherArticleId);
    }
    */
    if (req.body.email) {
        if (!validator.isEmail(req.body.email)) return res.status(400).end("bad input");
        req.body.email = validator.normalizeEmail(req.body.email);
    }
    if (req.body.value) {
        req.body.value = validator.escape(req.body.value);
    }
    if (req.body.mainArticleRole) {
        req.body.mainArticleRole = validator.escape(req.body.mainArticleRole);
    }
    if (req.body.otherArticleRole) {
        req.body.otherArticleRole = validator.escape(req.body.otherArticleRole);
    }
    if (req.body.description) {
        req.body.description = validator.escape(req.body.description);
    }
    if (req.body.content) {
        req.body.content = validator.escape(req.body.content);
    }
    if (req.body.description) {
        req.body.description = validator.escape(req.body.description);
    }
    next();
}
