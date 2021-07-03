module.exports = (sequelize, Sequelize) => {
    const FieldValue = sequelize.define('fieldValue', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        value: {
            type: Sequelize.TEXT
        }
    });

    return FieldValue;
};
