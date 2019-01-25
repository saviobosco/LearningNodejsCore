/**
 * Primary file for the api file
 * 
 */


var http = require('http');
var https = require('https');
var url = require('url');
var stringDecoder = require('string_decoder').StringDecoder;
var fs = require('fs');

var config = require('./config');
var data = require('./lib/data');
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');

//@TODO Get rid of this later
helpers.sendTwilioSMS("4158375309", "Hello world", function(err) {
    console.log("This was the error", err);
});


// Intantiates the HTTP server

var httpServer = http.createServer(function(req, res){
    unifiedServer(req, res);
});

// Start the HTTP Server
httpServer.listen(config.httpPort, function() {
    console.log("The server is listening on port " + config.httpPort + " in " + config.envName + " now");
})

var httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
};

// Intantiates the HTTPS Server
var httpsServer = https.createServer(httpsServerOptions, function(req, res){
    unifiedServer(req, res);
});


// Start the HTTPS Server
httpsServer.listen(config.httpsPort, function() {
    console.log("The server is listening on port " + config.httpsPort + " in " + config.envName + " now");
})


// All the server logic for both the http and https server
var unifiedServer = function(req, res) {
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
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJSONToObject(buffer)
        };

        // Route the request to the specified handler
        chosenHandler(data, function(statusCode, payload) {
            //Use the default
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            //payload
            payload = typeof(payload) == 'object' ? payload : {};

            // convert payload to string
            var payloadString = JSON.stringify(payload);

            //returning content type
            res.setHeader('Content-Type', 'application/json')
            // return response
            res.writeHead(statusCode);

            res.end(payloadString);

            console.log('Returning this response: ', statusCode, payloadString);

        });

    });
}




// Define a router 
var router = {
    'sample' : handlers.sample,
    'ping' : handlers.ping,
    'users' : handlers.users,
    'tokens' : handlers.tokens,
    'checks' : handlers.checks
};