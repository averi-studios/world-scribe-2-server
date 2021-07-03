const validator = require('validator');

module.exports = function (json) {
    if (json.name) {
        json.name = validator.unescape(json.name);
    }
    if (json.value) {
        json.value = validator.unescape(json.value);
    }
    if (json.mainArticleName) {
        json.mainArticleName = validator.unescape(json.mainArticleName);
    }
    if (json.mainArticleRole) {
        json.mainArticleRole = validator.unescape(json.mainArticleRole);
    }
    if (json.otherArticleName) {
        json.otherArticleName = validator.unescape(json.otherArticleName);
    }
    if (json.otherArticleRole) {
        json.otherArticleRole = validator.unescape(json.otherArticleRole);
    }
    if (json.description) {
        json.description = validator.unescape(json.description);
    }
    if (json.content) {
        json.content = validator.unescape(json.content);
    }
    if (json.description) {
        json.description = validator.unescape(json.description);
    }
    if (json.categoryName) {
        json.categoryName = validator.unescape(json.categoryName);
    }
    return json;
}