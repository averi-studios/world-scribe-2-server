const sqlite3 = require('sqlite3');
const fs = require('fs');

// Entries in this array must have the format of:
//    { versionNumber: int >= 1, migrationFunction: function that takes a single parameter named "database" and returns a Promise }
//
// "versionNumber" starts from 1 because the original database has a version number of 0.
// (Database version number is stored in the SQLite pragma parameter "user_version": https://sqlite.org/pragma.html#pragma_user_version)
// "versionNumber" MUST increment by intervals of 1. Do not skip, for example, from 1 to 3.
//
// The "database" parameter is the database object returned by "new sqlite3.Database()". Docs: https://www.npmjs.com/package/sqlite3#Usage
//
// All migration functions should be defined in this file, before "Migrations end here".
//
// Since the sqlite3 package uses callbacks, the general structure of a migration function should be to
// wrap the database code in a Promise constructor, and call resolve() and reject() as appropriate
// to end the function or raise an error. See the function for migration #1 for an example.
//
// NOTE: Don't forget to end each SQL statement with a semicolon.
const migrations = Object.freeze([
    { versionNumber: 1, migrationFunction: addIconColumnToCategory },
]);

function addIconColumnToCategory(database) {
    return new Promise((resolve, reject) => {
        database.run('ALTER TABLE categories ADD COLUMN icon TEXT;', (error) => {
            if (error) {
                reject(error);
            }
            resolve();
        });
    });
}

/*
 * =============================================================================
 * Migrations end here
 * =============================================================================
 */

function connectToAndReturnDatabase(databaseFilepath) {
    return new Promise((resolve, reject) => {
        const database = new sqlite3.Database(databaseFilepath, undefined, (err) => {
            if (err) {
                reject(err);
            }
        });
        database.on('open', () => {
            resolve(database);
        });
    })
}

function closeDatabase(database) {
    return new Promise((resolve, reject) => {
        database.close((err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

function getDatabaseVersion(database) {
    return new Promise((resolve, reject) => {
        database.get('PRAGMA user_version', (err, row) => {
            if (err) {
                pragmaError = err;
                reject(err);
            }

            let pragmaUserVersion = row.user_version;
            if (!pragmaUserVersion) {
                pragmaUserVersion = 0;
            }
            resolve(pragmaUserVersion);
        });
    });
}

function updateDatabaseVersion(database, newVersionNumber) {
    return new Promise((resolve, reject) => {
        database.run('PRAGMA user_version=' + newVersionNumber.toString(), (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

const applyMigrations = async function(databaseFilepath) {
    console.log('Connecting to database...')
    let database;
    try {
        database = await connectToAndReturnDatabase(databaseFilepath);
        console.log('Connected to database successfully');
    }
    catch (error) {
        console.log('Failed to connect to database due to error:');
        console.log(error);
        throw error;
    }

    console.log('Getting database version...')
    let databaseVersion;
    try {
        databaseVersion = await getDatabaseVersion(database);
        console.log('Retrieved database version: ' + databaseVersion.toString());
    }
    catch (error) {
        console.log('Failed to retrieve database version due to error:');
        console.log(error);
        throw error;
    }
    finally {
        try {
            await closeDatabase(database);
            console.log('Closed connection to database');
        } catch (error) {
            console.log('Failed to close database due to error:');
            console.log(error);
            throw error;
        }
    }

    if (migrations.length === 0 || databaseVersion >= migrations[migrations.length - 1].versionNumber) {
        console.log('No database migrations to apply');
        return;
    }

    console.log('Begin database migration...');

    console.log('Copying database file to safely apply migrations...');
    const databaseCopyFilepath = databaseFilepath.slice(0, databaseFilepath.lastIndexOf('.')) + '-migrated.sqlite';
    try{
        fs.copyFileSync(databaseFilepath, databaseCopyFilepath);
        console.log('Copied database file successfully to "' + databaseCopyFilepath + '"');
    } catch (error) {
        console.log('Failed to copy database file due to error:')
        console.log(error);
        throw error;
    }

    console.log('Connecting to database copy...')
    let databaseCopy;
    try {
        databaseCopy = await connectToAndReturnDatabase(databaseCopyFilepath);
        console.log('Connected to database copy successfully');
    }
    catch (error) {
        console.log('Failed to connect to database copy due to error:');
        console.log(error);
        throw error;
    }
    
    let hasModificationErrors = false;
    try {
        for (let i = 0; i < migrations.length; i++) {
            const migration = migrations[i];

            if (!databaseVersion || databaseVersion < migration.versionNumber) {
                try {
                    await migration.migrationFunction(databaseCopy);
                    console.log(`Successfully applied migration #${migration.versionNumber}`);
                }
                catch (error) {
                    console.log(`Migration #${migration.versionNumber} failed due to error:`);
                    console.log(error);
                    hasModificationErrors = true;
                    break;
                }

                try {
                    await updateDatabaseVersion(databaseCopy, migration.versionNumber);
                }
                catch (error) {
                    console.log(`Failed to update database version to ${migration.versionNumber} due to error:`);
                    console.log(error);
                    hasModificationErrors = true;
                    break;
                }

                databaseVersion = migration.versionNumber;
            }
        }
    } catch (error) {
        console.log('Encountered an error during the migration process:')
        console.log(error);
        hasModificationErrors = true;
    }
    finally {
        try {
            await closeDatabase(databaseCopy);
            console.log('Closed connection to database copy');
        } catch (error) {
            console.log('Failed to close database due to error:');
            console.log(error);
        }
    }

    if (hasModificationErrors) {
        console.log('Deleting database copy due to error(s) above...')
        try {
            fs.rmSync(databaseCopyFilepath);
            console.log('Database copy deleted successfully');
        } catch (error) {
            console.log('Failed to delete database copy due to error:');
            console.log(error);
        }
        throw new Error();
    }

    console.log('Deleting original database file so that it can be replaced by the migrated database...')
    try {
        fs.rmSync(databaseFilepath);
        console.log('Deleted original database file successfully')
    } catch (error) {
        console.log('Failed to delete original database file. Please delete it manually, then rename the migrated database file to "database.sqlite"');
        throw error;
    }
    console.log('Renaming the migrated database file to take on the name of the original database...');
    try {
        fs.renameSync(databaseCopyFilepath, databaseFilepath);
        console.log('Renamed migrated database file successfully');
        console.log('Database migration complete!')
    } catch (error) {
        console.log('Failed to rename migrated database file. Please manually rename it to "database.sqlite". Error:')
        console.log(error);
    }
}

module.exports = {
    migrations,
    applyMigrations
}
