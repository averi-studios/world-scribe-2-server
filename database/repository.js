const path = require('path');
const sqlite3 = require('sqlite3');

const { applyMigrations, migrations } = require('./applyMigrations');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const CategoryModel = require('./models/category');
const FieldModel = require('./models/field');
const ArticleModel = require('./models/article');
const FieldValueModel = require('./models/fieldValue');
const ConnectionModel = require('./models/connection');
const ConnectionDescriptionModel = require('./models/connectionDescription');
const SnippetModel = require('./models/snippet');

let repositorySingleton = null;

module.exports = async function({worldFolderPath, skipMigrations=false}) {
    if (repositorySingleton) {
        await repositorySingleton.disconnectFromDatabase();
    }

    const databaseFilepath = path.join(worldFolderPath, 'database.sqlite');

    /************************
        * DATABASE MIGRATIONS
        ************************/

    if (!skipMigrations) {
        try {
            await applyMigrations(databaseFilepath);
        }
        catch (error) {
            throw new Error('Aborting database setup due to migration errors');
        }
    }

    /**********************
        * DATABASE CONNECTION
        **********************/

    const sequelize = new Sequelize('database', 'username', 'password', {
        host: 'localhost',
        dialect: 'sqlite',
        operatorsAliases: false,
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        storage: databaseFilepath
    });

    /********************
        * MODEL DEFINITIONS
        ********************/

    const Category = CategoryModel(sequelize, Sequelize);
    const Field = FieldModel(sequelize, Sequelize);
    const Article = ArticleModel(sequelize, Sequelize);
    const FieldValue = FieldValueModel(sequelize, Sequelize);
    const Connection = ConnectionModel(sequelize, Sequelize);
    const ConnectionDescription = ConnectionDescriptionModel(sequelize, Sequelize);
    const Snippet = SnippetModel(sequelize, Sequelize);

    const Models = {
        Category: Category,
        Field: Field,
        Article: Article,
        FieldValue: FieldValue,
        Connection: Connection,
        ConnectionDescription: ConnectionDescription,
        Snippet: Snippet,
    };

    /*********************
        * MODEL ASSOCIATIONS
        *********************/

    Category.Field = Category.hasMany(Field);

    Category.Article = Category.hasMany(Article);
    Article.Category = Article.belongsTo(Category);

    FieldValue.Article = FieldValue.belongsTo(Article);
    FieldValue.Field = FieldValue.belongsTo(Field);

    Connection.MainArticle = Connection.belongsTo(Article, { as: 'mainArticle' });
    Article.Connection = Article.hasMany(Connection, { foreignKey: 'mainArticleId' })
    Connection.OtherArticle = Connection.belongsTo(Article, { as: 'otherArticle' });
    Connection.ConnectionDescription = Connection.belongsTo(ConnectionDescription);

    Article.Snippet = Article.hasMany(Snippet);
    Snippet.Article = Snippet.belongsTo(Article);


    /***************************************************************************************************
        * OPERATIONS
        ***************************************************************************************************/

    require('./operations/category')(Sequelize, sequelize, Models);
    require('./operations/article')(Sequelize, sequelize, Models);
    require('./operations/field')(Sequelize, sequelize, Models);
    require('./operations/connection')(Sequelize, sequelize, Models);
    require('./operations/snippet')(Sequelize, sequelize, Models);


    /***************************************************************************************************
        * CONFIGURATION
        ***************************************************************************************************/
    let disconnectFromDatabase = function() {
        return sequelize.close();
    }

    let setDatabaseVersionToLatest = async function() {
        if (migrations.length === 0 ) {
            return;
        }

        console.log('Connecting to database...')
        const connectToDatabasePromise = new Promise((resolve, reject) => {
            const database = new sqlite3.Database(databaseFilepath, undefined, (err) => {
                if (err) {
                    console.log('Failed to connect to database due to error:');
                    console.log(err);
                    reject(err);
                }
            });
            database.on('open', () => {
                console.log('Connected to database successfully');
                resolve(database);
            });
        })
        const database = await connectToDatabasePromise;

        console.log('Setting database version to latest...')
        const latestVersionNumber = migrations[migrations.length - 1].versionNumber;
        const setDatabaseVersionPromise = new Promise((resolve, reject) => {
            database.run('PRAGMA user_version=' + latestVersionNumber.toString(), (err) => {
                if (err) {
                    console.log('Failed to set database version to latest due to error:');
                    console.log(err);
                    reject(err);
                }
                resolve();
            });
        });
        await setDatabaseVersionPromise;
        console.log('Finished setting database version to latest.');
    }

    repositorySingleton = {
        setDatabaseVersionToLatest,
        disconnectFromDatabase,
        Category,
        Field,
        Article,
        FieldValue,
        Connection,
        ConnectionDescription,
        Snippet
    }

    await sequelize.authenticate();
    await sequelize.sync();

    return repositorySingleton;
}

