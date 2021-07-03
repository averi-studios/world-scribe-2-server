module.exports = (sequelize, Sequelize) => {
    const Category = sequelize.define('category', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT,
        },
        image: {
            type: Sequelize.STRING
        },
        icon: {
            type: Sequelize.STRING
        },
    }, {
        name: {
            singular: 'category',
            plural: 'categories'
        }
    });

    return Category;
};
