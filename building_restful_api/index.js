/**
 * Primary file for the api file
 * 
 */

 // Dependencies
 var server = require("./lib/server");

 var workers = require("./lib/workers");

 var app = {};

 app.init = function() {
    // Starting the server
    server.init();

    // Starting the workers
    workers.init();
 }

 //Execute 
 app.init();

 // Export the app
 module.exports = app;