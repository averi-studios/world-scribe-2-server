module.exports = (sequelize, Sequelize) => {
    const ConnectionDescription = sequelize.define('connectionDescription', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        content: {
            type: Sequelize.TEXT,
        }
    });

    return ConnectionDescription;
};
