/**
 * Request handler
 */
var _data = require('./data');
var helpers = require('./helpers');
var config = require("./../config");

//Define handlers = {}
var handlers = {}

handlers.ping = function(data, callback) {
    callback(200);
};

handlers.notFound = function(data, callback) {
    callback(404);
};

handlers.users = function(data, callback) {
    var acceptableMethods = ['post', 'put', 'get', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback)
    } else {
        callback(405);
    }
}

// Container for users object
handlers._users = {};

// Users - post
// Required data: firstname, lastname, phone, password, tosAgreement
// Optional Data: none

handlers._users.get = function(data, callback) {
    //Check that the phone is valid
    var phone = typeof(data.queryStringObject.phone) == "string" && data.queryStringObject.phone >= 10 ?
    data.queryStringObject.phone : false;
    if (phone) {

        //Get the token from the header
        var token = typeof(data.headers.token) == "string" ? data.headers.token : false;
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
            if (tokenIsValid) {
                _data.read("users", phone, function(err, data) {
                    if (!err && data) {
                        // remove the hashed password
                        delete data.password;
        
                        callback(200, data);
                    } else {
                        callback(404)
                    }
                });
            } else {
                callback(403, {"Error" : "Missing required token in header or token is invalid."})
            }
        });

    } else {
        callback(400, {"Error" : "Missing required field"});
    }

};

handlers._users.post = function(data, callback) {
    //Check that all required data are present
    var firstName = typeof(data.payload.firstName) == "string" &&
     data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;

    var lastName = typeof(data.payload.lastName) == "string" &&
     data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;

    var phone = typeof(data.payload.phone) == "string" &&
     data.payload.phone.trim().length >= 10 ? data.payload.phone.trim() : false;  

    var password = typeof(data.payload.password) == "string" &&
     data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    var tosAgreement = typeof(data.payload.tosAgreement) == "boolean" &&
     data.payload.tosAgreement == true ? true : false;
    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure user does not exist
        _data.read('users', phone, function(err) {
            if (err) {
                // Hash the password
                var hashedPassword = helpers.hash(password);
                if (hashedPassword) {
                    // create user
                    var userObject = {
                        'firstName' : firstName,
                        'lastName' : lastName,
                        'phone' : phone,
                        'hashedPassword' : hashedPassword,
                        'tosAgreement' : tosAgreement
                    };

                    _data.create('users', phone, userObject, function(err) {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, {"Error" : "Could not create the new user."}, err);
                        }
                    });
                } else {
                    callback(500, {"Error" : "Could not hash the user password"});
                }

            } else {
                callback(400, {"Error" : "A user with that phone already exists!"});
            }
        })
    } else {
        callback(400, {"Error" : "Missing required fields."});
    }
};

// Update details
// Required : phone number
// @TODO: only let authenticated users
handlers._users.put = function(data, callback) {
    var phone = typeof(data.payload.phone) == "string" && data.payload.phone.trim().length >= 10 ?
    data.payload.phone : false ;

    var firstName = typeof(data.payload.firstName) == "string" &&
     data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;

    var lastName = typeof(data.payload.lastName) == "string" &&
     data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;  

    var password = typeof(data.payload.password) == "string" &&
     data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone) {
        if (firstName || lastName || password) {

            //Get the token from the header
        var token = typeof(data.headers.token) == "string" ? data.headers.token : false;
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
            if (tokenIsValid) {
                _data.read("users", phone, function(err, userData) {
                    if (!err && data) {
                        // update the fields
                        if (firstName) {
                            userData.firstName = firstName;
                        }
                        if (lastName) {
                            userData.lastName = lastName;
                        }
                        if (password) {
                            userData.hashedPassword = helpers.hash(password);
                        }
                        // Store the new updates
                        _data.update("users", phone, userData, function(err) {
                            if (!err) {
                                callback(200)
                            } else {
                                console.log(err);
                                callback(500, {"Error" : "Could not update the user."})
                                
                            }
                        });
                    } else {
                        callback(400, {"Error" : "Specified user does not exist"});
                    }
                });
            } else {
                callback(403, {"Error" : "Missing required token in header or token is invalid."})
            }
        });
        } else {
            callback(400, {"Error" : "Missing fields to update"});
        }

    } else {
        callback(400, {"Error" : " Missing required field"});
    }
};

// Users - delete
// Required field : phone 
// @Todo: Only authenticated users
handlers._users.delete = function(data, callback) {
    var phone = typeof(data.payload.phone) == "string" && data.payload.phone.trim().length >= 10 ?
    data.payload.phone : false ;
    if (phone) {

        //Get the token from the header
        var token = typeof(data.headers.token) == "string" ? data.headers.token : false;
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
            if (tokenIsValid) {
                _data.read("users", phone, function(err, data) {
                    if (!err && data) {
                        _data.delete("users", phone, function(err) {
                            if (!err) {
                                callback(200);
                            } else {
                                callback(400, {"Error" : "could not delete the user."});
                            }
                        });
                    } else {
                        callback(400, {"Error" : "Specified user does not!."})
                    }
                });
            } else {
                callback(403, {"Error" : "Missing required token in header or token is invalid."})
            }
        });
    } else {
        callback(400, {"Error" : "Required fields missing."})
    }
};

handlers.tokens = function(data, callback) {
    var acceptableMethods = ['post', 'put', 'get', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback)
    } else {
        callback(405);
    }
}

//token handler container
handlers._tokens = {};

//Token - posts
//Required data : phone, password
// Optional data : none
handlers._tokens.post = function(data, callback) {
    var phone = typeof(data.payload.phone) == "string" && data.payload.phone.trim().length >= 10 ?
    data.payload.phone : false ;
    var password = typeof(data.payload.password) == "string" &&
     data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if (phone && password) {
        _data.read("users", phone, function(err, userData) {
            if(!err && userData) {
                //hash the sent password and compare it to the password stored in the user object
                var hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword) {
                    //if valid ,create a new token with the valid name, set expiration date 1 hour in the future
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;
                    var tokenObject = {
                        "phone" : phone,
                        "id" : tokenId,
                        "expires" : expires
                    };

                    if (tokenId) {
                        //Store the token
                        _data.create("tokens", tokenId, tokenObject, function(err) {
                            if(!err) {
                                callback(200, tokenObject);
                            } else {
                                callback(500, {"Error" : "Could not create the new token."});
                            }
                        });
                    } else {
                        callback(500, {"Error" : "Could not create new token."});
                    }
                } else {
                    callback(400, {"Error" : "Password did not match the specified user's stored password."});
                }

            }

        })
    } else {
        callback(400, {"Error" : "Missing required field(s)."})
    }

};

//Tokens - get
//Required : id
//Optional data : none
handlers._tokens.get = function(data, callback) {
    //Check that the id is valid
    var id = typeof(data.queryStringObject.id) == "string" && data.queryStringObject.id.trim().length >= 20 ?
    data.queryStringObject.id.trim() : false;
    if (id) {
        _data.read("tokens", id, function(err, tokenData) {
            if (!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404)
            }
        })
    } else {
        callback(400, {"Error" : "Missing required field"});
    }
};

//Tokens - put
// Required data : id, extend,
//Optional data : none
handlers._tokens.put = function(data, callback) {
    var id = typeof(data.payload.id) == "string" && data.payload.id.trim().length >= 20 ?
    data.payload.id : false ;
    var extend = typeof(data.payload.extend) == "boolean" && data.payload.extend == true ?
    true : false ;
    if (id && extend) {
        _data.read("tokens", id, function(err, tokenData) {
            if (!err && tokenData) {
                //Check to make sure the token isnt already expired
                if (tokenData.expires > Date.now()) {
                    // set the expiration an hour from now 
                    tokenData.expires = Date.now() + 1000 * 60 * 60 ;

                    // Store the now updates
                    _data.update("tokens", id, tokenData, function(err) {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, {"Error" : "Could not update the token's expiration."})
                        }
                    })
                } else {
                    callback(400, {"Error" : "The token has already expired and cannot be extended."})
                }
            } else {
                callback(400, {"Error" : "Specified token does not exists."})
            }
        })
    } else {
        callback(400, {"Error" : "Missing required fields or fields is invalid."})
    }
};

//Token - delete
// Required data : id
// Optional data : none
handlers._tokens.delete = function(data, callback) {
    var id = typeof(data.payload.id) == "string" && data.payload.id.trim().length >= 20 ?
    data.payload.id : false ;
    if (id) {
        _data.read("tokens", id, function(err, data) {
            if (!err && data) {
                _data.delete("tokens", id, function(err) {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(400, {"Error" : "could not delete the token."});
                    }
                });
            } else {
                callback(400, {"Error" : "Specified token does not exist!."})
            }
        });
    } else {
        callback(400, {"Error" : "Required fields missing."})
    }
};

// Verify that a given id is currently valid for a given user
handlers._tokens.verifyToken = function(id, phone, callback) {
    //lookup the token
    _data.read("tokens", id, function(err, tokenData) {
        if (!err && tokenData) {

            if (tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    })
}

// Checks 
handlers.checks = function(data, callback) {
    var acceptableMethods = ['post', 'put', 'get', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback)
    } else {
        callback(405);
    }
}

// Checks container 
handlers._checks = {};

// Checks : post
// Required data : protocol, url, method, successCode, timeoutSeconds
// Optional data : none
handlers._checks.post = function(data, callback) {
    var protocol = typeof(data.payload.protocol) == "string" && ['https', 'http'].indexOf(data.payload.protocol.toLowerCase()) > -1 ?
    data.payload.protocol : false ;
    var url = typeof(data.payload.url) == "string" && data.payload.url.trim().length >= 0 ?
    data.payload.url : false ;
    var method = typeof(data.payload.method) == "string" && ['post', 'put', 'get', 'delete'].indexOf(data.payload.method.toLowerCase()) > -1 ?
    data.payload.method : false ;
    var successCodes = typeof(data.payload.successCodes) == "object" && data.payload.successCodes instanceof Array && data.payload.successCodes.length >= 0 ?
    data.payload.successCodes : false ;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == "number" && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ?
    data.payload.timeoutSeconds : false ;
    console.log(protocol, url, method, successCodes, timeoutSeconds);
    
    if (protocol && url && method && successCodes && timeoutSeconds) {
        var token = typeof(data.headers.token) == "string" ? data.headers.token : false;
        _data.read("tokens", token, function(err, tokenData){
            if (!err && tokenData) {
                var userPhone = tokenData.phone;
                // look up the user 
                _data.read("users", userPhone, function(err, userData) {
                    if (!err && userData) {
                        var userChecks = typeof(userData.checks) == "object" && userData.checks instanceof Array ?
                        userData.checks : [] ;
                        //verify that the user has less that the number of max checks
                        if (userChecks.length < config.maxChecks) {
                            // create a random id for the check 
                            var checkId = helpers.createRandomString(20);
                            // creat checkobject and include user phone
                            var checkObject = {
                                'id' : checkId,
                                'userPhone' : userPhone,
                                'protocol' : protocol,
                                'url' : url,
                                'method' : method,
                                'successCodes' : successCodes,
                                'timeoutSeconds' : timeoutSeconds
                            }

                            // save the object 
                            _data.create("checks", checkId, checkObject, function(err){
                                if (!err) {
                                    // add the check id to users object
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);
                                    _data.update("users", userPhone, userData, function(err) {
                                        if(!err) {
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, {"Error" : "Could not update user with new check"})
                                        }
                                    });
                                } else {
                                    callback(500, {"Error" : "Could not create the new check."})
                                }
                            })
                        } else {
                            callback(400, {"Error" : "User already has maximum number of checks {" + config.maxChecks + "}"});
                        }
                    } else {
                        callback(403);
                    }
                })
            } else {
                callback(403)
            }
        });
    } else {
        callback(400, {"Error" : "Missing required input(s)."});
    }
}

module.exports = handlers;