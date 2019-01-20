/**
 * Request handler
 */
var _data = require('./data');
var helpers = require('./helpers');

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
        _data.read("users", phone, function(err, data) {
            if (!err && data) {
                // remove the hashed password
                delete data.password;

                callback(200, data);
            } else {
                callback(404)
            }
        })
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
                        'password' : hashedPassword,
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
                        userData.password = password;
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
        })
    } else {
        callback(400, {"Error" : "Required fields missing."})
    }
};



module.exports = handlers;