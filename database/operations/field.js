module.exports = (Sequelize, sequelize, Models) => {
    const Field = Models["Field"];
    const Article = Models["Article"];
    const FieldValue = Models["FieldValue"];

    Article.updateField = async function(articleId, fieldId, newValue) {
        let returnedObject = {};

        let article = await Article.findOne({
            where: { id: articleId }
        });
        let fieldValue = await FieldValue.findOne({
            where: { articleId: articleId, fieldId: fieldId },
            include: [{ model: Field, as: 'field' }]
        });

        fieldValue.value = newValue;
        await fieldValue.save();

        returnedObject.id = fieldValue.field.id;
        returnedObject.articleId = fieldValue.articleId;
        returnedObject.name = fieldValue.field.name;
        returnedObject.value = fieldValue.value;
        returnedObject.createdAt = fieldValue.createdAt;
        returnedObject.updatedAt = fieldValue.updatedAt;

        return returnedObject;
    }

    Article.getFields = async function(articleId, offset, limit) {
        let returnedObjects = [];

        let fieldValues = await FieldValue.findAll({
            offset: offset,
            limit: limit,
            where: { articleId: articleId },
            order: sequelize.col('name'),
            include: [
                { model: Field, as: 'field' }
            ]
        });

        fieldValues.forEach(function(fieldValue) {
            let returnedObject = {};

            returnedObject.id = fieldValue.field.id;
            returnedObject.articleId = fieldValue.articleId;
            returnedObject.name = fieldValue.field.name;
            returnedObject.value = fieldValue.value;
            returnedObject.createdAt = fieldValue.createdAt;
            returnedObject.updatedAt = fieldValue.updatedAt;

            returnedObjects.push(returnedObject);
        });

        return returnedObjects;
    }

    Field.getFieldsInCategory = async function(categoryId, offset, limit){
        let fields = await Field.findAll({
            attributes: [
                'id',
                'name',
                'createdAt',
                'updatedAt'
                ],
            offset: offset,
            limit: limit,
            where: {
                categoryId: categoryId
            },
            order: sequelize.col('name'),
            raw: true
        });
        return fields;
    }

    Field.createField = async function(categoryId, newFieldName){
        let existingField = await Field.findOne({
            where: { categoryId: categoryId, name: newFieldName }
        });
        if (existingField) {
            throw {
                status: 409,
                message: `Category '${categoryId}'' already has a Field named '${newFieldName}'`,
                error: new Error()
            }
        }

        let field = await Field.create({categoryId: categoryId, name: newFieldName});
        let articles = await Article.findAll({where: {categoryId: categoryId}});
        await Promise.all(articles.map(async (article) => {
            await FieldValue.create({ articleId: article.id, fieldId: field.id });
        }));
        return field;
    }

    Field.renameField =  async function(fieldId, newName){
        let renamedField = await Field.findOne({where: {id:fieldId}});
        if (!renamedField) {
            throw {
                status: 404,
                message: `Field '${fieldId}' does not exist in the current World`,
                error: new Error()
            };
        }

        let existingField = await Field.findOne({
            where: { categoryId: renamedField.categoryId, name: newName }
        });
        if (existingField) {
            throw {
                status: 409,
                message: `Category '${renamedField.categoryId}'' already has a Field named '${newName}'`,
                error: new Error()
            }
        }

        renamedField.name = newName;
        await renamedField.save();
        return renamedField;
    }

    Field.deleteField = async function(fieldId){
        let deletedField = await Field.findOne({where: {id:fieldId}});
        if (!deletedField) {
            throw {
                status: 404,
                message: `Field '${fieldId}' does not exist in the current World`,
                error: new Error()
            };
        }
        await FieldValue.destroy({where: {fieldId: fieldId}});
        await deletedField.destroy();
        return deletedField.toJSON();
    }
};