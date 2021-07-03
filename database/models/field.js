module.exports = (sequelize, Sequelize) => {
    const Field = sequelize.define('field', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        }
    });

    return Field;
};
