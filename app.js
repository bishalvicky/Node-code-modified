
var express = require('express');
var cfenv = require('cfenv');
var Q = require('q');

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

function checkCheckList(checklist){
	function checkCheckList(){
		var deferred = Q.defer();
		var assets = checklist.assets;
		var regions = checklist.regions;
		var gateways = [];
		var promise =  Q.all(regions.map(function(item){
			db.get(item,function(err, body){
				gateways = gateways.concat(body.gateways);
				return gateways;
			});
		}));
		/*for (var j = 0; j < regions.length; j++){
			db.get(regions[j],function(err, body){
				gateways = gateways.concat(body.gateways);
				console.log(gateways);
			});
		}
		deferred.resolve(gateways);
		return deferred.promise;*/
		return promise;
	};
	checkCheckList().then(function(data){
		console.log(data);
	});
}

function main(){
	//Get the name of the logged in user from session
	var username = "skjindal93";
	var password = "hehe"; //Password filled by user

	db.get(username, function(err, body){
		//Check password
		if (password === body.password){

			//Authenticated
			var checklists = body.checklists;
			for (var i = 0; i < checklists.length; i++){
				//console.log(checklists[i]);
				checkCheckList(checklists[i]);
			}
		}
	});
};

main();
// start server on the specified port and binding host
app.listen(appEnv.port, appEnv.bind, function() {
	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
