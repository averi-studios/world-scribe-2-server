module.exports = (sequelize, Sequelize) => {
    const Connection = sequelize.define('connection', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        otherArticleRole: {
            type: Sequelize.STRING,
        }
    });

    return Connection;
};
