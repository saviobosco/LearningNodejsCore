/**
 * helpers for various tasks
 */
var crypto = require('crypto');
var config = require('.././config');

 var helpers = {};

 // Create a SHA256 hash
helpers.hash = function(str) {
    if (typeof(str) == "string" && str.length > 0) {
        var hash = crypto.createHmac("sha256", config.hashingSecret).update(str).digest("hex");
        return hash;
    } else {
        return false
    }
}

// Parse a JSON string to an object without throwing 
helpers.parseJSONToObject = function(str) {
    try {
        var obj = JSON.parse(str);
        return obj;
    } catch (e) {
        return {};
    }
}

//Create a string of alphanumeric characters of a given length 
helpers.createRandomString = function(strLength) {
    strLength = typeof(strLength) == "number" && strLength > 0 ? strLength : false;
    if(strLength) {
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

        //Start the final string
        var str = "";
        for(i = 1; i <= strLength; i++) {
            //get a random character from the possible character string
            var randomCharacter  = possibleCharacters.charAt(Math.random() * possibleCharacters.length);

            str+= randomCharacter;
        }
        return str;
    } else {
        return false;
    }
}

 module.exports = helpers;