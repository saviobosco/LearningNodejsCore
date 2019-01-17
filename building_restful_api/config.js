/**
 * Create and Export Configuration variable
 */

 //Container for all the environment
 var environments = {};

 // Staging (default) environment
 environments.staging = {
     'port' : 3000,
     'envName' : 'staging'
 };

environments.production = {
    'port' : 5000,
    'envName' : 'production'
};

//Determine which environment was passed as a command-line argument
var currentEnviroment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environment above, if not, default to staging
var environmentToExport = typeof(environments[currentEnviroment]) == 'object' ? environments[currentEnviroment] : environments.staging ;

// Export the module
module.exports = environmentToExport;