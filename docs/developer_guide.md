# Developer Guide

## Running the Server Locally

### Pre-Requisites

- All operating systems:
  - Node.js 14.14.0

    - We recommend installing it through [nvm](https://github.com/nvm-sh/nvm) (for Windows, use [nvm-windows](https://github.com/coreybutler/nvm-windows) instead). nvm will allow you to easily switch between Node versions.

- Windows:

  - [windows-build-tools](https://www.npmjs.com/package/windows-build-tools)

- Mac & Linux:

  - Python 2.7

### Instructions

1. Open the root directory of this project in your command line tool
2. Run `npm install`
3. Run `npm run rebuild` -- this will rebuild the SQLite 3 package so that it is compatible with your operating system
4. Run `npm start`


The server should now be active at http://localhost:49000.

