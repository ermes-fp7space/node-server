var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var config = require('../config/environment');

var sequelize = new Sequelize(config.SQL.db, config.SQL.auth.user, config.SQL.auth.pass, {
  host: config.SQL.host,
  port: config.SQL.port,
  dialect: 'postgres',

  pool: {
    max: 25,
    min: 0,
    idle: 10000
  },

  define: {schema: config.SQL.defaultSchema}
});

sequelize.initModels = function(syncParameters) {
  "use strict";

  // Initialize local models
  return new Promise(function (resolve, reject) {
    console.log('\t* Initializing local models...');

    // Read and import local models from models dir
    fs.readdir('./models/local', (err, files) => {

      files.forEach((file) => {
        sequelize.import(path.resolve('./models/local/' + file));
      });
      resolve();

    });
  }).then(() => {
    console.log('\t-> DONE Initializing local models');
    return sequelize.sync(syncParameters);
  }).catch((err) => {
    console.error('\t-> ERROR Initializing local models' + err);
  });

};

module.exports = sequelize;

