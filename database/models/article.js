module.exports = (sequelize, Sequelize) => {
    const Article = sequelize.define('article', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        image: {
            type: Sequelize.STRING
        }
    });

    return Article;
};
