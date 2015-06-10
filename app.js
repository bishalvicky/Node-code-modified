var express = require('express');
var cfenv = require('cfenv');
var Q = require('q');
var appEnv = cfenv.getAppEnv();
var request = require('request');

var user = "a-jq3b5v-nyywcig5q2";
var pass = "vAlx3YAaFY2xJ!8*Gf";


var app = express();
var cloudant;
var bodyParser = require('body-parser')


var dbCredentials = {
	dbName : 'nodered'
};

var insertdb = require('./routes/insertdb');
var locationFromDevice = require('./routes/locationFromDevice');

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.use(express.static(__dirname + '/public'));
app.use('/insertdb',insertdb);
app.use('/locationFromDevice',locationFromDevice);


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


function locationFromGateway(gateway){
	//console.log(gateway);
	var deferred = Q.defer();
	var options = {
	  url: 'https://jq3b5v.internetofthings.ibmcloud.com/api/v0001/historian/JavaDevice/'+gateway+'?top=1',
	  headers: {
	  	'Authorization': 'Basic ' + new Buffer(user + ':' + pass).toString('base64') 
	  }
	}

	request(options, function(error, response, html){

		var json = JSON.parse(html);
		//console.log(json);
		var data = json[0].evt;
		
		var assets = data.assets.split(" , ");
		var latitude = data.latitude;
		var longitude = data.longitude;
		var altitude = data.altitude;

		var json = {
			"type": "Point",
			"coordinates": [latitude, longitude, altitude],
			"assets": assets
		}

		db.get(gateway, { revs_info: true }, function(err, body) {

		  if (!err){

	  		//Getting revision number of assets document
	    	rev = body._rev;
	    	//Deleting if rev exists
	    	if (typeof rev !== "undefined"){
			  	db.destroy(gateway, rev, function(err, body){
			  		
			  		if (!err){
			  			console.log(gateway + " Destroyed");
			  			db.insert(json, gateway, function(err, body, header) {
			  				console.log(json);
								if (err)
									console.log('[' + gateway + '.insert] ', err.message);
							  console.log('Inserted in '+gateway);
							  //console.log("1");
							  deferred.resolve(true);
							});
			  		}
			  		else {
			  			db.insert(json, gateway, function(err, body, header) {
			  				//console.log(json);
								if (err)
									console.log('[' + gateway + '.insert] ', err.message);
							  console.log('Inserted in '+gateway);
							  console.log("1");
							  deferred.resolve(true);
							});
			  		}
			  	});
			  }
	  	}
		});	
	});
	return deferred.promise;
}

function checkCheckList(checklist){
	var assets;
	var assetsPresent = [];
	function checkCheckList(){
		var deferred = Q.defer();
		assets = checklist.assets;
		
		//check all assets availability in the given regions
		for (var asset = 0; asset < assets.length; asset++)
			assetsPresent.push(false);

		//read regions from checklist
		var regions = checklist.regions;
		var gateways = [];
		var promises = [];

		//find out all the gateways in the given regions
		regions.map(function(item){
			var deferred = Q.defer();
			
			//append gateways in the given regions
			db.get(item,function(err, body){
				gateways = gateways.concat(body.gateways);
				deferred.resolve(gateways);
			});

			promises.push(deferred.promise);
		});

		return Q.all(promises);
	};

	checkCheckList().spread(function(gateways){
		var promises = [];

		//for each asset
		assets.forEach(function(asset, assetIndex){

			//check asset in each gateway
			gateways.forEach(function(gateway, gatewayIndex){
				
				var deferred = Q.defer();
				db.get(gateway, function(err, body){
					console.log(gateway);
					//if asset present in this gateway
					if (body.assets.indexOf(asset) > - 1){
						//console.log(asset+" is present in "+gateways[gatewayIndex]);
						assetsPresent[assetIndex] = true;

						//console.log(body);
						//addToTrace(body, asset);

					}
					else {
						//console.log("Not present");
					}
					deferred.resolve(assetsPresent);
				});
				promises.push(deferred.promise);
			});
		});

		Q.all(promises).then(function(data){
			var assetsMissingBoolean = data[data.length-1];
			assetsMissingBoolean.forEach(function(assetBoolean, assetBooleanIndex){

				//check which assets from checklist are missing from specified regions
				if (!assetBoolean){
					console.log(assets[assetBooleanIndex]+" is missing!!!!!!!!!");
					checkInOtherRegions(assets[assetBooleanIndex]);
				}
			});
			
		});
	});
}


function addToTrace(gateway, asset){
	db.get(asset, function(err, body){
		//console.log(body.trace);

		var assetTrace = body.trace;
		//console.log(assetTrace);
		assetTrace.push(gateway.coordinates);
		//console.log(asset+" : "+assetTrace);
	});
};

function checkInOtherRegions(asset){
	var regions;
	//get all regions from data file
	db.get("data", function(err, body){
		regions = body.regions;

		//for all regions
		regions.forEach(function(region, regionIndex){
			
			//get DOC of the region
			db.get(region, function(err, body){

				//get all gateways in that region
				var gatewaysInRegion = body.gateways;

				//for all gateways in that region
				gatewaysInRegion.forEach(function(gatewayInRegion, gatewaysInRegionIndex){

					//get DOC of the gateway
					db.get(gatewayInRegion, function(err, body){

						//get all assets in that gateway
						var assetsInGateway = body.assets;

						//if given asset found in assets of that gateway
						if(assetsInGateway.indexOf(asset) > -1){

							//addToTrace(body, asset);
							console.log(asset+" found in "+region);
							//break;
						}
					});
					
				});
			});
		});
	});
};


function main(){
	//Get the name of the logged in user from session
	var username = "skjindal93";
	var password = "hehe"; //Password filled by user
	

	db.get(username, function(err, bodyUsername){
		//Check password
		if (password === bodyUsername.password){
			//Authenticated
			
			db.get("data", function(err, body){
				console.log("Data");
				var promisesX = [];
				var gateways = body.gateways;
				//var gateways = ["gateway_7cd1c39d10f0","gateway_8cd1c39d10f0","gateway_9cd1c39d10f0"];
				gateways.forEach(function (gateway, gatewayIndex){
					var promise = locationFromGateway(gateway).then(function(data){
						return Q(true);
					});
					promisesX.push(promise);
				});

				var checklists = bodyUsername.checklists;
				Q.all(promisesX).then(function(data){
					checklists.forEach(function(checklist,checklistIndex){
						checkCheckList(checklist);
					});
				});
			});
			
			
		}
	});
};
var debug = true;
if (debug){
	setInterval(function(){
		main();
	},5000);
}
/*
function doSomething(){
	var deferred = Q.defer();
	setTimeout(function(){
		deferred.resolve("Heelo!");
	},10000);
	return deferred.promise;
}

var a = [1,2,3,4,5];
var promises = [];
a.forEach(function(item,index){
    var deferred = Q.defer();
    var promise = doSomething().then(function(){
        return Q(true);
    });
    promises.push(promise);
});

Q.all(promises).then(function(data){
  console.log(promises.length);
});
*/
// start server on the specified port and binding host
app.listen(appEnv.port, appEnv.bind, function() {
	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
