
# Overview

Please include a summary of your contribution.

# Checklist

## General

- [ ] Where applicable, I have logged errors that may be useful for troubleshooting to console.log().

## Route Changes

- [ ] I have verified that the root route (http://localhost:49000/) responds to a GET request with a 200 response.
- [ ] I have verified that the affected route(s) respond to inputs (including erroneous inputs) with the appropriate responses (including errors).
- [ ] **For new routes:** I have verified that the new route(s) do not conflict with, or block, other routes.

## Database Changes

- [ ] I have verified that my changes work on existing Worlds and do NOT corrupt .sqlite files.
- [ ] I have verified that my changes work on newly-created Worlds.
- [ ] **For schema changes:** I have added a migration to database/applyMigrations.js and verified that it migrates existing World databases successfully.
- [ ] **For schema changes:** I have made the necessary changes to the appropriate Sequelize data model class(es) in the database/models folder.

