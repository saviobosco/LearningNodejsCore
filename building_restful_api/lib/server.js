/**
 * Server related tasks
 * 
 */


var http = require('http');
var https = require('https');
var url = require('url');
var stringDecoder = require('string_decoder').StringDecoder;
var fs = require('fs');
var path = require("path");

// Instatiate a server module object 
var server = {};

var config = require('.././config');
var data = require('./data');
var handlers = require('./handlers');
var helpers = require('./helpers');
var util = require("util");
 var debug = util.debuglog("server");


// Intantiates the HTTP server

server.httpServer = http.createServer(function(req, res){
    server.unifiedServer(req, res);
});

server.httpsServerOptions = {
    'key' : fs.readFileSync(path.join(__dirname,"/../https/key.pem")),
    'cert' : fs.readFileSync(path.join(__dirname, "/../https/cert.pem"))
};

// Intantiates the HTTPS Server
server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res){
    server.unifiedServer(req, res);
});



// All the server logic for both the http and https server
server.unifiedServer = function(req, res) {
    // Get the url and parse it 
    var parsedUrl = url.parse(req.url, true);

    // Get the path 
    var path = parsedUrl.pathname;

    var trimmedPath = path.replace(/^\/+|\/+$/g, '')

    // Get the query string as an object 
    var queryStringObject = parsedUrl.query;
    //Get the HTTP Method
    var method = req.method.toLowerCase();

    //Get reques headers
    var headers = req.headers;

    // modify the header token 
    headers.token = (typeof(headers.authorization) === "string") ? headers.authorization.split(" ")[1] : false;
    headers.token =  typeof(headers.token) === "string" ? headers.token : false;

    //Get the payload
    var decoder = new stringDecoder('utf-8');
    var buffer = '';
    req.on('data', function(data) {
        buffer += decoder.write(data);
    });
    req.on('end', function() {
        buffer += decoder.end();

        // Choose the request handler, if not found us not found handler
        var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJSONToObject(buffer)
        };

        // Route the request to the specified handler
        chosenHandler(data, function(statusCode, payload, contentType) {
            //Use the default
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            // Detemine the type of response (fallback to JSON)
            contentType = typeof(contentType) == 'string' ? contentType : 'json';
            
            //return the response parts that are content-specific 
            var payloadString = '';
            if (contentType === 'json') {
                res.setHeader('Content-Type', 'application/json')
                payload = typeof(payload) == 'object' ? payload : {};
                payloadString = JSON.stringify(payload);
            }

            if (contentType === 'html') {
                res.setHeader('Content-Type', 'text/html')
                payload = typeof(payload) === 'string' ? payload : '';
                payloadString = payload;
            }

            // Return the response parts that are coomon to all content-types
            // return response
            res.writeHead(statusCode);

            res.end(payloadString);

            // if the response is 200 print green else print red
            if (statusCode === 200) {
                debug("\x1b[32m%s\x1b[0m", method.toUpperCase() + " /" + trimmedPath + " " + statusCode);
            } else {
                debug("\x1b[31m%s\x1b[0m", method.toUpperCase() + " /" + trimmedPath + " " + statusCode);
            }

        });

    });
}




// Define a router 
server.router = {
    '' : handlers.index,
    'account/create' : handlers.accountCreate,
    'account/edit' : handlers.accountEdit,
    'account/deleted' : handlers.accountDeleted,
    'session/create' : handlers.sessionCreate,
    'session/deleted' : handlers.sessionDeleted,
    'checks/all' : handlers.checksList,
    'checks/create' : handlers.checksCreate,
    'checks/edit' : handlers.checksEdit,
    'ping' : handlers.ping,
    'api/users' : handlers.users,
    'api/tokens' : handlers.tokens,
    'api/checks' : handlers.checks
};


server.init = function() {
    // Start the HTTP Server
    server.httpServer.listen(config.httpPort, function() {
        console.log("\x1b[36m%s\x1b[0m", "The server is listening on port " + config.httpPort + " in " + config.envName + " now");
    });

    // Start the HTTPS Server
    server.httpsServer.listen(config.httpsPort, function() {
        console.log("\x1b[35m%s\x1b[0m", "The server is listening on port " + config.httpsPort + " in " + config.envName + " now");
    })
}

module.exports = server;