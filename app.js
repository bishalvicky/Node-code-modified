var express = require('express');
var cfenv = require('cfenv');
var Q = require('q');
var appEnv = cfenv.getAppEnv();
var request = require('request');
var ibmbluemix = require('ibmbluemix');
var ibmpush = require('ibmpush');
var geojson = require('geojson-utils');


var user = "a-jq3b5v-nyywcig5q2";
var pass = "vAlx3YAaFY2xJ!8*Gf";

var appConfig = {
    applicationId: "f1e442d6-79bb-4e42-baee-3da1d7ac583c",
    applicationRoute: "http://node-code.mybluemix.net",
    applicationSecret: "d59b875fbe53ed4340df9304747bf182d2bba0ea"
};

ibmbluemix.initialize(appConfig);
//var logger = ibmbluemix.getLogger();
var push=ibmpush.initializeService();

var app = express();
var cloudant;
var bodyParser = require('body-parser')


var dbCredentials = {
	dbName : 'nodered'
};

var insertdb = require('./routes/insertdb');
var locationFromDevice = require('./routes/locationFromDevice');
var addGateways = require('./routes/addGateways');
var addAssets = require('./routes/addAssets');
var addRegions = require('./routes/addRegions');
var setup = require('./routes/setup');
var checklist = require('./routes/checklist');
var addChecklist = require('./routes/addChecklist');
var checklistEndPoint = require('./routes/checklistEndPoint');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.use(express.static(__dirname, 'public'));
app.use('/insertdb',insertdb);
app.use('/locationFromDevice',locationFromDevice);
app.use('/addGateways',addGateways);
app.use('/addAssets',addAssets);
app.use('/addRegions',addRegions);
app.use('/setup', setup);
app.use('/checklist', checklist);
app.use('/addChecklist', addChecklist);
app.use('/checklistEndPoint',checklistEndPoint);

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


function assetListFromGateway(gateway){
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

		var json_point = {
			"type": "Point",
			"coordinates": [latitude, longitude, altitude],
			"assets": assets
		}

		db.get(gateway, { revs_info: true }, function(err, body) {

		  	if (!err){
				json_point._rev = body._rev;
				db.insert(json_point,gateway,function(err,body){
					if(!err)
						console.log('Updated Doc: ' + gateway);
					else
						console.log("Gateway Update Error: " + gateway);
					deferred.resolve(true);
				});
	  		}

		  	else {
	  			db.insert(json_point,gateway,function(err,body){
					if(!err)
						console.log('Updated Doc: ' + gateway);
					else
						console.log("Gateway Update Error: " + gateway);
					deferred.resolve(true);
				});
	  		}

		});	
	});
	return deferred.promise;
}
// Form array of gateways in regions
function listOfGatewaysAndRegions(checklist){
	//var deferred = Q.defer();  

	console.log("yahan!!!");
	//read regions from checklist
	var regions = checklist.regions;

	//console.log(regions);
	var gateways = [];
	var promises = [];
	var regionPolygons = [];

	//find out all the gateways in the given regions
	regions.map(function(item){

		var deferred = Q.defer();
		//append gateways in the given regions
		db.get(item,function(err, body){
			//console.log("Adding Region:" + item);
			gateways = gateways.concat(body.gateways);
			var region_json = {
				"region": item,
				"type": "Polygon",
				"coordinates": item.coordinates
			}

			regionPolygons = regionPolygons.push(region_json);
			var gatewaysAndRegions = {
				"gateways": gateways,
				"regions": regionPolygons
			}
			console.log("Here:\n" + gatewaysAndRegions + "\n\n");
			deferred.resolve(gatewaysAndRegions);
		});

		promises.push(deferred.promise);
	});

	return Q.all(promises);               
}

function checkNonGPSinGateways(asset, gateways, assetsPresent, assetIndex){
	var promisesGateways = [];

	gateways.forEach(function(gateway, gatewayIndex){

		var deferredGateway = Q.defer();
		db.get(gateway, function(err, body){

			//if asset present in this gateway
			if (body.assets.indexOf(asset) > - 1){
				console.log(asset+" is present in "+gateways[gatewayIndex]);
				assetsPresent[assetIndex] = true;
				addToTrace(asset, gateway).then(function(){
					deferredGateway.resolve(true);
				});
			}
			else {
				//console.log("Not Found!!");
				deferredGateway.resolve(true);
			}
		});

		promisesGateways.push(deferredGateway.promise);
	});
	return Q.all(promisesGateways);
}

function checkGPSinRegions(asset, regionPolygons, assetsPresent, assetIndex){
	var tukdeAsset = asset.split("_");
	var gateway = "gateway"+"_"+tukdeAsset[1];
	var promises = [];
	var deferred = Q.defer();
	
	db.get(gateway, { revs_info: true }, function(err, body) {

		regionPolygons.forEach(function(regionPolygon, regionPolygonIndex){
			var contains = geojson.pointInPolygon(body,regionPolygon);
			if (contains)
				assetsPresent[assetIndex] = true;
		});
		
		deferred.resolve(true);
	});

	return deferred.promise;
}

function checkCheckList(checklist){

	var deferredCheckList = Q.defer();
	var assets;
	var assetsPresent = [];

	assets = checklist.assets;
	console.log(assets.length);
	//check all assets availability in the given regions
	for (var asset = 0; asset < assets.length; asset++)
		assetsPresent.push(false);

	listOfGatewaysAndRegions(checklist).spread(function(data){
		
		//console.log("Yahan!!!!!!");
		var gateways = data.gateways;
		var regions = data.regions;

		var promises = [];
		//for each asset
		assets.forEach(function(asset, assetIndex){

			var deferred_asset = Q.defer();

			db.get(asset, function(err, bodyAsset){
				if (bodyAsset.type !== "gps"){
					checkNonGPSinGateways(asset, gateways, assetsPresent, assetIndex).then(function(){
						deferred_asset.resolve(true);
					});
				}
				else {
					checkGPSinRegions(asset, regions, assetsPresent, assetIndex).then(function(){
						deferred_asset.resolve(true);
					});
				}
			});
			promises.push(deferred_asset.promise);
		});
		
		
		Q.all(promises).then(function(data){
			var assetsMissingBoolean = assetsPresent;
			var promisesRegions = [];
			assetsMissingBoolean.forEach(function(assetBoolean, assetBooleanIndex){

				//check which assets from checklist are missing from specified regions
				if (!assetBoolean){
					console.log("Missing Asset: " + assets[assetBooleanIndex]);
					var promiseCheckInOtherRegions = Q.defer();
					checkInOtherRegions(assets[assetBooleanIndex]).then(function(){
						promiseCheckInOtherRegions.resolve(true);
					});
					promisesRegions.push(promiseCheckInOtherRegions.promise);
				}
			});

			Q.all(promisesRegions).then(function(){
				//console.log("CheckList Done");
				deferredCheckList.resolve("CheckList Done");
			});
		});
	});
	return deferredCheckList.promise;
}


function addToTrace(asset,gateway){

	console.log("AddToTrace");
	var deferred = Q.defer();
	db.get(asset, function(err,body){

		var trace_json = {
			"gateway" : gateway,
			"timestamp" : Date.now()
		};
		
		var arr = body.trace.slice();
		arr.push(trace_json);
		
		var asset_json = { 
			"_rev": body._rev,
			"type" : body.type,
			"rules" : body.rules,
			"trace" : arr
		};

		var message = { 
			//"alert" : "Missing Asset: "+ asset + "	Now in Gateway:" + gateway ,
			"alert": "Testing",
			"url": "http://www.google.com"
		};
		//console.log(body.trace, body.trace.length);
		var exactly = false;
		if (body.trace.length === 0){
			exactly = true;
		}
		else if (body.trace[body.trace.length-1].gateway !== gateway){
			exactly = true;
		}
		else {
			deferred.resolve(true);
		}

		if (exactly){
			/********************************************************************
			*******************************ALERT*********************************
			*********************************************************************/
			push.sendBroadcastNotification(message,null).then(function (response) {
				console.log("Notification sent successfully to all devices.");
			}, function(err) {
				console.log("Failed to send notification to all devices.");
				console.log(err);
			});	
			db.insert(asset_json, asset, function(err, body, header) {
				deferred.resolve(true);
			});
		}
	});
	return deferred.promise;
};

function checkInOtherRegions(asset){
	var regions;
	var found = 0;
	var deferred = Q.defer();
	//get all regions from data file
	db.get("data", function(err, body){
		regions = body.regions;

		var promises = [];
		//for all regions
		regions.forEach(function(region, regionIndex){
			
			var deferred_found = Q.defer();
			//get DOC of the region
			db.get(region, function(err, body){

				//get all gateways in that region
				var gatewaysInRegion = body.gateways;
				
				var promiseRegion = function(){
					var promisesGateways = [];
					//for all gateways in that region
					gatewaysInRegion.forEach(function(gatewayInRegion, gatewaysInRegionIndex){

						var deferredGateway = Q.defer();
						//get DOC of the gateway
						db.get(gatewayInRegion, function(err, body){
							//get all assets in that gateway
							var assetsInGateway = body.assets;

							//if given asset found in assets of that gateway
							if(assetsInGateway.indexOf(asset) > -1){
								found = 1;
								console.log("Missing Asset: "+ asset + "	Found in: " + gatewayInRegion + "["+region+"]");
								addToTrace(asset,gatewayInRegion).then(function(){
									deferredGateway.resolve(true);
								});
							}
							else {
								deferredGateway.resolve(true);
							}
						});
						promisesGateways.push(deferredGateway.promise);
					});
					return Q.all(promisesGateways);
				}
				promiseRegion().then(function(){
					deferred_found.resolve(true);
				});
			});
			promises.push(deferred_found.promise);
		});

		Q.all(promises).then(function(){
			if(found == 0){
				console.log("Missing Asset: "+asset+ " Not found anywhere!!");
				addToTrace(asset,"Missing").then(function(){
					deferred.resolve(true);
				});
			}
		});
	});
	return deferred.promise;
};


function main(){
	console.log("\n\nMain:\n");
	var deferredMain = Q.defer();
	//Get the name of the logged in user from session
	var username = "skjindal93";
	var password = "hehe"; //Password filled by user
	

	db.get(username, function(err, bodyUsername){
		//Check password
		if (password === bodyUsername.password){
			//Authenticated
			
			db.get("data", function(err, body){
				var promisesX = [];
				var promisesChecklist = [];
				var gateways = body.gateways;
				console.log(gateways);
				//var gateways = ["gateway_7cd1c39d10f0","gateway_8cd1c39d10f0","gateway_9cd1c39d10f0"];
				gateways.forEach(function (gateway, gatewayIndex){
					var deferredPromise = Q.defer();
					//console.log("Gateways Started");
					assetListFromGateway(gateway).then(function(data){
						deferredPromise.resolve(true);
					});
					promisesX.push(deferredPromise.promise);
				});

				var checklists = bodyUsername.checklists;

				Q.all(promisesX).then(function(data){
					
					console.log("Checklist Started:");
					var promisesChecklists = [];
					checklists.forEach(function(checklist,checklistIndex){
						var promisecheckChecklist = Q.defer();
						checkCheckList(checklist).then(function(){
							promisecheckChecklist.resolve(true);
						});
						promisesChecklists.push(promisecheckChecklist.promise);
					});
					Q.all(promisesChecklists).then(function(){
						//console.log("Length: "+promisesChecklists.length);
						//callback();
						deferredMain.resolve("Main Done");
						console.log("Main Done!!")
					});
				});

			});
		}
	});
	deferredMain.promise.then(function(){
		main();
	});
};

var debug = false;
if (debug){
	main();
}

//var a = geojson.pointInPolygon({"type":"Point","coordinates":[3,3]},{"type":"Polygon", "coordinates":[[[0,0],[6,0],[6,6],[0,6]]]});
//console.log(a);

// start server on the specified port and binding host
/*app.listen(appEnv.port, appEnv.bind, function() {
	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
*/
var server = app.listen(6001, '0.0.0.0', function() {
  console.log('Listening on port %d', server.address().port);
});
