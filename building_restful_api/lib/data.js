/**
 * Library for storing and editing data
 */

 var fs = require('fs');
 var path = require('path');
 var helpers = require('./helpers');

// Container for the module to be exported
var lib = {};

//base directory of the data folder
lib.baseDir = path.join(__dirname, '../.data/');

//write data to a file 
lib.create = function(dir, file, data, callback) {
    //Open the fs for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', function(err, fileDescriptor){
        if(!err && fileDescriptor) {
            //convert data to a string
            var stringData = JSON.stringify(data);

            // write to file 
            fs.writeFile(fileDescriptor, stringData, function(err) {
                if(!err) {
                    fs.close(fileDescriptor, function(err) {
                        if(!err) {
                            callback(false);
                        } else {
                            callback('Error closing new file');
                        }
                    })
                } else {
                    callback('Error writing to new file');
                }
            })
        } else {
            callback('Could not create new file, it may already exist');
        }
    })
}

// Users 
// Required data : phone
//Optional data : none
// Only authenticated users can access their object.
lib.read = function(dir, file, callback) {
    fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf-8', function(err, data) {
        if (!err && data) {
            var parsedData = helpers.parseJSONToObject(data);
            callback(false, parsedData)
        } else {
            callback(err, data);
        }
    });
}

lib.update = function(dir, file, data, callback) {
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', function(err, fileDescriptor) {
        if(!err && fileDescriptor) {

            //convert data to a string
            var stringData = JSON.stringify(data);

            // truncate the content of the file 
            fs.truncate(fileDescriptor, function(err) {
                if(!err) {
                    fs.writeFile(fileDescriptor, stringData, function(err) {
                        if(!err) {
                            fs.close(fileDescriptor, function(err) {
                                if(!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing the file');
                                }
                            })
                        } else {
                            callback('Error writing to existing file');
                        }
                    })
                } else {
                    callback('Error truncating file')
                }
            }) 
            
        } else {
            callback('could not open the file for updating, it may not exist yet.')
        }
    })
}

lib.delete = function(dir, file, callback) {
    // Removing file
    fs.unlink(lib.baseDir+dir+'/'+file+'.json', function(err) {
        if(!err) {
            callback(false);
        } else {
            callback('Error deleting the file');
        }
    });
}

// List all items in a directory
lib.list = function(dir, callback) {
    fs.readdir(lib.baseDir + dir + "\\" , function(err, data) {
        if (!err && data && data.length > 0) {
            var trimmedFileNames = [];
            data.forEach((fileName) => {
                trimmedFileNames.push(fileName.replace(".json", ""));
            });
            callback(false, trimmedFileNames);
        } else {
            callback(err, data);
        }
    })
}
 module.exports = lib;