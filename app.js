
var express = require('express');
var cfenv = require('cfenv');

var app = express();
var cloudant;

var dbCredentials = {
	dbName : 'nodered'
};

var insertdb = require('./routes/insertdb');

app.use('/insertdb',insertdb);

app.use(express.static(__dirname + '/public'));
var appEnv = cfenv.getAppEnv();


function initDBConnection() {
	if(process.env.VCAP_SERVICES) {
		var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
		if(vcapServices.cloudantNoSQLDB) {
			dbCredentials.host = vcapServices.cloudantNoSQLDB[0].credentials.host;
			dbCredentials.port = vcapServices.cloudantNoSQLDB[0].credentials.port;
			dbCredentials.user = vcapServices.cloudantNoSQLDB[0].credentials.username;
			dbCredentials.password = vcapServices.cloudantNoSQLDB[0].credentials.password;
			dbCredentials.url = vcapServices.cloudantNoSQLDB[0].credentials.url;
		}
		console.log('VCAP Services: '+JSON.stringify(process.env.VCAP_SERVICES));
	}
  else{
    dbCredentials.host = "f0549f34-78ea-44d4-9abe-efd87b2286d3-bluemix.cloudant.com";
		dbCredentials.port = 443;
		dbCredentials.user = "f0549f34-78ea-44d4-9abe-efd87b2286d3-bluemix";
		dbCredentials.password = "f6fe0f1a13a6c758ca4d45b4ef2b41ec9e329f04199635762f6db15e16803fc6";
		dbCredentials.url = "https://f0549f34-78ea-44d4-9abe-efd87b2286d3-bluemix:f6fe0f1a13a6c758ca4d45b4ef2b41ec9e329f04199635762f6db15e16803fc6@f0549f34-78ea-44d4-9abe-efd87b2286d3-bluemix.cloudant.com";
  }

	cloudant = require('cloudant')(dbCredentials.url);
	
	//check if DB exists if not create
	cloudant.db.create(dbCredentials.dbName, function (err, res) {
		//if (err) { console.log('could not create db ', err); }
    });
	db = cloudant.use(dbCredentials.dbName);
}

initDBConnection();

// start server on the specified port and binding host
app.listen(appEnv.port, appEnv.bind, function() {
	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
