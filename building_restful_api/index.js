/**
 * Primary file for the api file
 * 
 */


var http = require('http');
var url = require('url');
var stringDecoder = require('string_decoder').StringDecoder;

var config = require('./config');
// the server should respond to all request with a string
var server = http.createServer(function(req, res){
    // Get the url and parse it 
    var parsedUrl = url.parse(req.url, true);

    // Get the path 
    var path = parsedUrl.pathname;

    var trimmedPath = path.replace(/^\/+|\/+$/g, '')

    // Get the query string as an object 
    var queryStringObject = parsedUrl.query;
    //Get the HTTP Method
    var method = req.method.toUpperCase();

    //Get reques headers
    var headers = req.headers;

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
            'payload' : buffer
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

            console.log('Returning this response: ', statusCode, payloadString, res.headers);

        })

        // Send the response

        // log the request path
    });


});

// Start the server
server.listen(config.port, function() {
    console.log("The server is listening on port " + config.port + " in " + config.envName + " now");
})
//Define handlers = {}
var handlers = {}

handlers.sample = function(data, callback) {
    //Callback a http status code and a payload object
    callback(406, {'name' : 'sample handler'})
};

handlers.notFound = function(data, callback) {
    callback(404);
};

// Define a router 
var router = {
    'sample' : handlers.sample
}