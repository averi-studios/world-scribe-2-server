module.exports = (Sequelize, sequelize, Models) => {
    const Snippet = Models["Snippet"];
    const Article = Models["Article"];

    Article.createSnippet = async function(articleId, snippetName) {
        let existingSnippet = await Snippet.findOne({
            where: { articleId: articleId, name: snippetName }
        });
        if (existingSnippet) {
            throw new Error(`Snippet named '${snippetName}' already exists for Article '${articleId}'`);
        }

        let article = await Article.findOne({
            where: { id: articleId }
        });
        let snippet = await Snippet.create({
            name: snippetName,
            articleId: articleId,
            content: ''
        });

        return snippet;
    };

    Article.getSnippets = async function(articleId, offset, limit) {
        let snippets = await Snippet.findAll({
            attributes: ['id', 'name', 'createdAt', 'updatedAt'],
            offset: offset,
            limit: limit,
            where: { articleId: articleId },
            order: sequelize.col('name')
        });

        return snippets;
    };

    Snippet.getSnippet = async function(snippetId) {
        let snippet = await Snippet.findOne({
            attributes: ['content'],
            where: { id: snippetId }
        });

        return snippet;
    };

    Snippet.updateSnippet = async function(snippetId, newContent) {
        let snippet = await Snippet.findOne({
            where: { id: snippetId }
        });

        if (!snippet) {
            throw new Error(`Snippet '${snippetId}' does not exist`);
        }

        snippet.content = newContent;
        await snippet.save();

        return snippet;
    }

    Snippet.deleteSnippet = async function(articleId, snippetId) {
        let deletedSnippet = await Snippet.findOne({
            where: { id: snippetId, articleId: articleId },
            raw: true
        });

        if (!deletedSnippet) {
            throw {
                status: 404,
                message: `Snippet '${snippetId}' does not exist for Article '${articleId}' in the current World`,
                error: new Error()
            };
        }

        let numArticlesDeleted = await Snippet.destroy({
            where: { id: snippetId }
        });
        if (numArticlesDeleted === 0) {
            throw {
                status: 500,
                message: `Failed to delete Snippet '${snippetId}' due to an internal server error`,
                error: new Error()
            };
        }

        return deletedSnippet;
    };

};