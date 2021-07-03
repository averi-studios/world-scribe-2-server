module.exports = (Sequelize, sequelize, Models) => {
    const Connection = Models["Connection"];
    const Category = Models["Category"];
    const Article = Models["Article"];
    const ConnectionDescription = Models["ConnectionDescription"];
    const Op = Sequelize.Op;

    Connection.createConnection = async function(mainArticleId, otherArticleId) {
        let article = await Article.findOne({
            where: { id: mainArticleId }
        });
        let connectionDescription = await ConnectionDescription.create({
            content: '',
        });
        let mainConnection = await Connection.create({
            mainArticleId: mainArticleId,
            otherArticleId: otherArticleId,
            otherArticleRole: '',
            connectionDescriptionId: connectionDescription.id,
        });
        let otherConnection = await Connection.create({
            mainArticleId: otherArticleId,
            otherArticleId: mainArticleId,
            otherArticleRole: '',
            connectionDescriptionId: connectionDescription.id,
        });

        let returnedObject = {};

        returnedObject.id = mainConnection.id;
        returnedObject.mainArticleId = mainConnection.mainArticleId;
        returnedObject.mainArticleRole = otherConnection.otherArticleRole;
        returnedObject.otherArticleId = mainConnection.otherArticleId;
        returnedObject.otherArticleRole = mainConnection.otherArticleRole;
        returnedObject.description = connectionDescription.content;
        returnedObject.createdAt = mainConnection.createdAt;
        returnedObject.updatedAt = mainConnection.updatedAt;

        return returnedObject;
    };

    Connection.updateConnection = async function(connectionId, mainArticleRole, otherArticleRole, description) {
        let mainConnection = await Connection.findOne({
            where: {
            id: connectionId
            }
        });
        if (!mainConnection) {
            throw new Error(`Connection '${connectionId}'' does not exist`);
        }
        let otherConnection = await Connection.findOne({
            where: {
            mainArticleId: mainConnection.otherArticleId,
            otherArticleId: mainConnection.mainArticleId
            }
        });
        if (!otherConnection) {
            throw new Error(`Mirror Connection associated with Connection '${connectionId}' does not exist`);
        }
        let connectionDescription = await ConnectionDescription.findOne({
            where: {
            id: mainConnection.connectionDescriptionId
            }
        });
        if (!connectionDescription) {
            throw new Error(`Connection Description associated with Connection '${connectionId}' does not exist`);
        }

        mainConnection.otherArticleRole = otherArticleRole;
        await mainConnection.save();
        otherConnection.otherArticleRole = mainArticleRole;
        await otherConnection.save();
        connectionDescription.content = description;
        await connectionDescription.save();

        let returnedObject = {};

        returnedObject.id = mainConnection.id;
        returnedObject.mainArticleId = mainConnection.mainArticleId;
        returnedObject.mainArticleRole = otherConnection.otherArticleRole;
        returnedObject.otherArticleId = mainConnection.otherArticleId;
        returnedObject.otherArticleRole = mainConnection.otherArticleRole;
        returnedObject.description = connectionDescription.content;
        returnedObject.createdAt = mainConnection.createdAt;
        returnedObject.updatedAt = mainConnection.updatedAt;

        return returnedObject;
    }

    Article.getConnections = async function(articleId, offset, limit) {
        let connections = await Connection.findAll({
            attributes: [
                'id',
                'mainArticleId',
                'otherArticleId',
                'otherArticleRole',
                [sequelize.col('otherArticle.name'), 'otherArticleName'],
                [sequelize.col('connectionDescription.content'), 'description'],
                'createdAt',
                'updatedAt'
            ],
            offset: offset,
            limit: limit,
            where: {
                mainArticleId: articleId
            },
            order: sequelize.col('otherArticle.name'),
            include: [{
                attributes: [],
                model: ConnectionDescription
                }, {
                attributes: [],
                association: Connection.OtherArticle,
            }]
        });

        return connections;
    };

    Connection.getConnection = async function(connectionId) {
        let connection = await Connection.findOne({
            attributes: [
                'id',
                'mainArticleId',
                [sequelize.col('mainArticle.name'), 'mainArticleName'],
                [sequelize.col('mainArticle.name'), 'mainArticleName'],
                'otherArticleId',
                'otherArticleRole',
                [sequelize.col('otherArticle.name'), 'otherArticleName'],
                [sequelize.col('connectionDescription.content'), 'description'],
                'createdAt',
                'updatedAt'
            ],
            where: {
                id: connectionId
            },
            include: [{
                attributes: [],
                model: ConnectionDescription
                }, {
                attributes: [],
                association: Connection.MainArticle,
                }, {
                attributes: [],
                association: Connection.OtherArticle,
            }],
            raw: true
        });

        let reverseConnection = await Connection.findOne({
            where: {
                mainArticleId: connection.otherArticleId,
                otherArticleId: connection.mainArticleId
            }
        });

        connection.mainArticleRole = reverseConnection.otherArticleRole;

        return connection;
    };

    Connection.getAvailableArticlesForConnection = async function(articleId) {
        let article = await Article.findOne({
            where: { id: articleId }
        });
        let categories = await Category.findAll({
            attributes: [ 'id', 'name' ],
        });

        let existingConnections = await Connection.findAll({
            attributes: [ 'otherArticleId' ],
            where: { mainArticleId: articleId }
        });
        let invalidArticleIds = existingConnections.map((existingConnection) => {
            return existingConnection.otherArticleId;
        });
        invalidArticleIds.push(articleId);

        let articlesByCategory = await Promise.all(categories.map(async (category) => {
            let categoryObject = { name: category.name };

            categoryObject.articles = await Article.findAll({
                attributes: [ 'id', 'name', 'createdAt', 'updatedAt' ],
                where: {
                    id: { [Op.notIn] : invalidArticleIds },
                    categoryId: category.id
                },
                raw: true
            });

            return categoryObject;
        }));

        return articlesByCategory;
    };

    Connection.deleteConnection = async function(articleId, connectionId) {
        let mainDeletedConnection = await Connection.findOne({
            where: { id: connectionId, mainArticleId: articleId },
            raw: true
        });

        if (!mainDeletedConnection) {
            throw {
                status: 404,
                message: `Connection '${connectionId}' does not exist for Article '${articleId}' in the current World`,
                error: new Error()
            };
        }

        let otherDeletedConnection = await Connection.findOne({
            where: {
                mainArticleId: mainDeletedConnection.otherArticleId,
                otherArticleId: articleId
            },
            raw: true
        });

        if (!otherDeletedConnection) {
            throw {
                status: 404,
                message: `Could not find reverse Connection for Connection with ID '${connectionId}'`,
                error: new Error()
            };
        }

        let connectionDescription = await ConnectionDescription.findOne({
            where: {
                id: mainDeletedConnection.connectionDescriptionId
            },
            raw: true
        });

        if (!connectionDescription) {
            throw {
                status: 404,
                message: `Could not find Connection Description for Connection with ID '${connectionId}'`,
                error: new Error()
            };
        }

        try {
            await sequelize.transaction(t => {
            return ConnectionDescription.destroy({
                where: { id: mainDeletedConnection.connectionDescriptionId }
            }, { transaction: t }).then(() => {
                return Connection.destroy({
                where: { id: otherDeletedConnection.id }
                }, { transaction: t }).then(() => {
                return Connection.destroy({
                    where: { id: mainDeletedConnection.id }
                });
                });
            });
            })
            return mainDeletedConnection;
        }
        catch(error) {
            throw {
                status: 500,
                message: `Failed to delete Connection '${connectionId}' due to an internal server error`,
                error: new Error()
            };
        }
    };

};