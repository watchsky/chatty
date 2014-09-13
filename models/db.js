var Db = require("mongodb").Db;
var Server = require("mongodb").Server;
var dbSettings = require("./db-settings");

module.exports = new Db(dbSettings.db, new Server(dbSettings.host, dbSettings.post));
