module.exports = (sequelize, Sequelize) => {
    const Snippet = sequelize.define('snippet', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        content: {
            type: Sequelize.TEXT
        }
    });

    return Snippet;
};
