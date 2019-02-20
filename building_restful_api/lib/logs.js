/**
 * This is a library for storing and rotating logs 
 */

 //Deps
 var fs = require("fs");
 var path = require("path");
 var zlib = require("zlib");

 //Container of the module
 var lib = {};

 //Base directory of the logs folder
 lib.baseDir = path.join(__dirname, "./../.logs/");

 // Append a string to a file, Create the file if it does not exist.
 lib.append = function(file, str, callback) {
     //Open the file for appending
     fs.open(lib.baseDir + file + ".log","a", function(err, fileDescriptor) {
        if(!err && fileDescriptor) {
            // Append to the file and close it
            fs.appendFile(fileDescriptor, str + "\n", function(err) {
                if (!err) {
                    fs.close(fileDescriptor, function(err) {
                        if(!err) {
                            callback(false);
                        } else {
                            callback("Error closing file that was being appended.")
                        }
                    });
                } else {
                    callback("Error appending file");
                }
            })
        } else {
            callback("Could not open file for appending");
        }
     });
 }


 //List all the logs and optionally include the compressed logs
 // if true is passed, it list all logs with compressed included else it lists all uncompressed logs
 lib.list = function(includeCompressedlog, callback) {
     fs.readdir(lib.baseDir, function(err, data) {
         if (!err && data && data.length > 0) {
            var trimmedFileNames = [];
            data.forEach(function(fileName) {
                // Add the .log files 
                if (fileName.indexOf(".log") > -1) {
                    trimmedFileNames.push(fileName.replace(".log", ""));
                }

                // add on the .gz files 
                if (fileName.indexOf(".gz.b64") > -1 && includeCompressedlog) {
                    trimmedFileNames.push(fileName.replace(".gz.b64", ""));
                }
            });
            callback(false, trimmedFileNames);
         } else {
             callback(err, data)
         }
     })
 }


 //Compress the contents of one .log file into a .gz.b64 file within the same directory
 lib.compress = function(logId, newfileId, callback) {
    var sourceFile = logId + ".log";
    var destinationFile = newfileId + ".gz.b64";

    // Read the source file 
    fs.readFile(lib.baseDir + sourceFile, "utf8", function(err, inputString) {
        if(!err && inputString) {
            // Compress the data using gzip
            zlib.gzip(inputString, function(err, buffer) {
                if (!err && buffer) {
                    // send the data to the destination File
                    fs.open(lib.baseDir + destinationFile, "wx", function(err, fileDescriptor) {
                        if (!err && fileDescriptor) {
                            //Write to the destination file
                            fs.writeFile(fileDescriptor, buffer.toString("base64"), function(err) {
                                if (!err) {
                                    // Close the destination file 
                                    fs.close(fileDescriptor, function(err) {
                                        if (!err) {
                                            callback(false);
                                        } else {
                                            callback(err);
                                        }
                                    });
                                } else {
                                    callback(err);
                                }
                            })
                        } else {
                            callback(err);
                        }
                    })
                } else {
                    callback(err);
                }
            })
        } else {

        }
    });
 }

 //Decompress the contents of a .gz.b64 file into a string variable
 lib.decompress = function(fileId, callback) {
     var fileName = fileId + ".gz.b64";
     fs.readFile(lib.baseDir + fileName, function(err, str) {
         if (!err && str) {
            // Decompress the data
            var inputBuffer = Buffer.from(str, "base64");
            zlib.unzip(inputBuffer, function(err, outputBuffer) {
                if (!err && outputBuffer) {
                    // Callback 
                    var str = outputBuffer.toString();
                    callback(false, str);
                } else {
                    callback(err);
                }
            })
         } else {
             callback(err);
         }
     });
 }

 // Truncate a log file
 lib.truncate = function(logId, callback) {
     fs.truncate(lib.baseDir + logId + ".log", 0, function(err){
        if (!err) {
            callback(false);
        } else {
            callback(err);
        }
     });
 }

 // Export the module 
 module.exports = lib;