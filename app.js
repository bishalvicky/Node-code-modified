var express = require('express');
var cfenv = require('cfenv');
var Q = require('q');
var appEnv = cfenv.getAppEnv();
var request = require('request');
var ibmbluemix = require('ibmbluemix');
var ibmpush = require('ibmpush');
var geojson = require('geojson-utils');
var session = require('express-session');

var appConfig = {
    applicationId: "f1e442d6-79bb-4e42-baee-3da1d7ac583c",
    applicationRoute: "http://node-code.mybluemix.net",
    applicationSecret: "d59b875fbe53ed4340df9304747bf182d2bba0ea"
};


ibmbluemix.initialize(appConfig);
//var logger = ibmbluemix.getLogger();
var push = ibmpush.initializeService();

var app = express();
var cloudant;
var bodyParser = require('body-parser')


var dbCredentials = {
	dbName : 'nodeblue'
};

function checkBasicAuthentication(req){
	var deferred = Q.defer();
	var auth = req.headers['authorization'];
	if(!auth) {
		deferred.resolve(JSON.stringify({"status":false,"error":"No credentials passed!"}));
	}
	else if(auth) {
		var tmp = auth.split(' ');   // Split on a space, the original auth looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part

		var buf = new Buffer(tmp[1], 'base64'); // create a buffer and tell it the data coming in is base64
		var plain_auth = buf.toString();        // read it back out as a string

		// At this point plain_auth = "username:password"
		var creds = plain_auth.split(':');      // split on a ':'
		var username = creds[0];
		var password = creds[1];

		var options = {
			url: req.protocol + '://' + req.get('host') + '/logincheck', 
			form: {data:req.body}
		};

		request.post(options, function(request, response){
			var body =  JSON.parse(response.body);
			var check = body.status;

			if(check){
				deferred.resolve(JSON.stringify({"username":username,"password":password,"status":true}));
			}
			else{
				deferred.resolve(JSON.stringify({"username":username,"status":false,"error":body.error}));
			}
		});
	}
	return deferred.promise;
}

functions = {checkBasicAuthentication : checkBasicAuthentication};

var insertdb = require('./routes/insertdb');
var locationFromDevice = require('./routes/locationFromDevice');
var locationFromDeviceEndPoint = require('./routes/locationFromDeviceEndPoint');
var addGateways = require('./routes/addGateways');
var addAssets = require('./routes/addAssets');
var addRegions = require('./routes/addRegions');
var setup = require('./routes/setup');
var checklist = require('./routes/checklist');
var logout = require('./routes/logout');

var register = require('./routes/register');
var login = require('./routes/login');
var logincheck = require('./routes/logincheck');

var addChecklist = require('./routes/addChecklist');
var checklistEndPoint = require('./routes/checklistEndPoint');
var movingGatewayTrace = require('./routes/movingGatewayTrace');


app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));


app.use(session({secret: 'baaga'}));
app.use(express.static(__dirname, 'public'));
app.use('/insertdb',insertdb);
app.use('/locationFromDevice',locationFromDevice);
app.use('/movingGatewayTrace', movingGatewayTrace);
app.use('/locationFromDeviceEndPoint',locationFromDeviceEndPoint);
app.use('/addGateways',addGateways);
app.use('/addAssets',addAssets);
app.use('/addRegions',addRegions);
app.use('/setup', setup);
app.use('/checklist', checklist);
app.use('/register',register);
app.use('/login',login);
app.use('/logincheck',logincheck);
app.use('/addChecklist', addChecklist);
app.use('/checklistEndPoint',checklistEndPoint);
app.use('/logout',logout)

var session_data;
app.get('/',function(req,res){
	session_data = req.session;
	if(session_data.username){
		res.redirect('checklist');
	}
	else
		res.redirect('login');
	
});

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
		if (vcapServices["iotf-service"]) {
			user = vcapServices["iotf-service"][0].credentials.apiKey;
			pass = vcapServices["iotf-service"][0].credentials.apiToken;
			org = vcapServices["iotf-service"][0].credentials.org;
		}
		console.log('VCAP Services: '+JSON.stringify(process.env.VCAP_SERVICES));
	}
	  else{
	    dbCredentials.host = "f0549f34-78ea-44d4-9abe-efd87b2286d3-bluemix.cloudant.com";
			dbCredentials.port = 443;
			dbCredentials.user = "f0549f34-78ea-44d4-9abe-efd87b2286d3-bluemix";
			dbCredentials.password = "f6fe0f1a13a6c758ca4d45b4ef2b41ec9e329f04199635762f6db15e16803fc6";
			dbCredentials.url = "https://f0549f34-78ea-44d4-9abe-efd87b2286d3-bluemix:f6fe0f1a13a6c758ca4d45b4ef2b41ec9e329f04199635762f6db15e16803fc6@f0549f34-78ea-44d4-9abe-efd87b2286d3-bluemix.cloudant.com";
	  	user = "a-rgecs9-wssdsn55el";
			pass = "6vCRrc9UaFE?kwO@Z3";
			org = "rgecs9";
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
	  url: 'https://'+org+'.internetofthings.ibmcloud.com/api/v0001/historian/Pi/'+gateway+'?top=1',
	  headers: {
	  	'Authorization': 'Basic ' + new Buffer(user + ':' + pass).toString('base64') 
	  }
	}

	db.get(gateway,function(err,body){
		if(!err){
			var json_point = body;
		}
		else{
			var json_point = {
				"type": "Point",
				"coordinates": [0, 0, 0],
				"assets": []
			};
		}
		request(options, function(error, response, html){
			var json = JSON.parse(html);

			if(!json.error){
				//var json = JSON.parse(html);
				var data = json[0].evt;
				var assets = data.assets;
				var latitude = data.latitude;
				var longitude = data.longitude;
				var altitude = data.altitude;

				json_point = {
					"type": "Point",
					"coordinates": [latitude, longitude, altitude],
					"assets": assets
				};	
			}
			insertToDb(json_point,gateway).then(function(){
				deferred.resolve(true);
			});
				
		});
	});
	return deferred.promise;
}


// Form array of gateways in regions
function listOfGatewaysAndRegions(checklist){
	//var deferred = Q.defer();  

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

			/**************************************
			***************ERROR CHECK*************
			***************************************/

			gateways = gateways.concat(body.gateways);
			// console.log("HERE----" + item.coordinates);
			var region_json = {
				"region": item,
				"type": "Polygon",
				"coordinates": body.coordinates
			}

			regionPolygons.push(region_json);
			
			deferred.resolve(true);
		});

		promises.push(deferred.promise);
	});
	
	var deferredBla = Q.defer();
	Q.all(promises).then(function(){
		
		var gatewaysAndRegions = {
			"gateways": gateways,
			"regions": regionPolygons
		}
		deferredBla.resolve(gatewaysAndRegions);
	});
	return deferredBla.promise;
}

function checkNonGPSinGateways(asset, gateways, assetsPresent, assetIndex, username){
	var promisesGateways = [];
	var message_alert;
	gateways.forEach(function(gateway, gatewayIndex){

		var deferredGateway = Q.defer();
		db.get(gateway, function(err, body){
			if(!err){
				//if asset present in this gateway
				if (body.assets.indexOf(asset) > - 1){
					console.log(asset+" is present in "+gateways[gatewayIndex]);
					assetsPresent[assetIndex] = true;
					message_alert = asset+": Now present in "+gateways[gatewayIndex];
					addToTraceAndNotify(asset, gateway, message_alert, username).then(function(){
						deferredGateway.resolve(true);
					});
				}	
				else {
					//console.log("Not Found!!");
					deferredGateway.resolve(true);
				}
			}
			else{
				console.log("Get Error");
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

	//console.log(gateway);
	db.get(gateway, function(err, body) {
		if(!err){
			regionPolygons.forEach(function(regionPolygon, regionPolygonIndex){
				var contains = geojson.pointInPolygon(body,regionPolygon);
				if (contains){
					assetsPresent[assetIndex] = true;
					console.log(asset+" is present in "+regionPolygon.region)
				}
					
			});
		}
		else{
			console.log("Get Error");
		}
		deferred.resolve(true);
	});
	return deferred.promise;
}

function checkCheckList(checklist,username){

	var deferredCheckList = Q.defer();
	var assets;
	var assetsPresent = [];

	assets = checklist.assets;
	//check all assets availability in the given regions
	for (var asset = 0; asset < assets.length; asset++)
		assetsPresent.push(false);

	listOfGatewaysAndRegions(checklist).then(function(data){

		//console.log(JSON.stringify(data));
		var gateways = data.gateways;
		var regions = data.regions;

		var promises = [];
		//for each asset
		//console.log(assets);
		assets.forEach(function(asset, assetIndex){
			var deferred_asset = Q.defer();
			db.get(asset, function(err, bodyAsset){
				if(!err){
					if (bodyAsset.type !== "gps"){
						checkNonGPSinGateways(asset, gateways, assetsPresent, assetIndex, username).then(function(){							
							deferred_asset.resolve(true);
						});
					}
					else {
						checkGPSinRegions(asset, regions, assetsPresent, assetIndex).then(function(){
							deferred_asset.resolve(true);
						});
					}
				}
				else{
					console.log("Get Error!");
					deferred_asset.resolve(true);
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


					db.get(assets[assetBooleanIndex], function(err,body){
						
						if(!err){
							if(body.type == "gps"){
								checkInOtherRegionsGPS(assets[assetBooleanIndex],checklist.regions).then(function(){
									promiseCheckInOtherRegions.resolve(true);
								});
							}
							else{
								checkInOtherRegionsNonGPS(assets[assetBooleanIndex],checklist.regions,username).then(function(){
									promiseCheckInOtherRegions.resolve(true);
								});
							}
						}
						else{
							console.log("Get Error!");
							promiseCheckInOtherRegions.resolve(true);
						}

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


function checkInOtherRegionsNonGPS(asset,checkedRegions, username){
	var found = 0;
	var deferred = Q.defer();
	var message_alert;
	//get all regions from data file
		var regions = globalData.regions;
		var promises = [];
		//for all regions
		regions.forEach(function(region, regionIndex){
			
			var deferred_found = Q.defer();
			if(checkedRegions.indexOf(region)<0){
				// console.log("Checking for " + asset + " in "+ region);
				//get DOC of the region
				db.get(region, function(err, body){
					if(!err){
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
										message_alert = "Missing Asset: "+ asset + "	Found in: " + gatewayInRegion + "["+region+"]";
										console.log(message_alert);
										addToTraceAndNotify(asset,gatewayInRegion,message_alert, username).then(function(){
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
					}
					else{
						console.log("Get Error!");
						deferred_found.resolve(true);
					}
				});
			}
			else
				deferred_found.resolve(true);
			
			promises.push(deferred_found.promise);
		});

		Q.all(promises).then(function(){
			if(found == 0){
				message_alert = "Missing Asset: "+asset+ " Not found anywhere!!";
				console.log(message_alert);
				addToTraceAndNotify(asset,"Missing",message_alert,username).then(function(){
					
					deferred.resolve(true);
				});
			}
			else
				deferred.resolve(true);
		});
	return deferred.promise;
};

function checkInOtherRegionsGPS(asset,checkedRegions){
	
	var found = 0;
	var tukdeAsset = asset.split("_");
	var gateway = "gateway"+"_"+tukdeAsset[1];
	var regions = globalData.regions;
	var deferred_fun = Q.defer();

	db.get(gateway,function(err,body){
		if(!err){
			var promises = [];
			regions.forEach(function(region,regionIndex){
				var deferred = Q.defer();
				db.get(region,function(err,bodyRegion){
					if(!err){
						if(checkedRegions.indexOf(region)<0){							
							var contains = geojson.pointInPolygon(body,bodyRegion);
							//console.log(body.coordinates + " in " + bodyRegion.coordinates + "-" + contains);
							if(contains){
								found = 1;
								console.log("Missing Asset:" + asset + " Found in region:" + region);
							}
						}		
					}
					deferred.resolve(true);			
				});
				promises.push(deferred.promise);
			});

			Q.all(promises).then(function(data){
				if(!found){
					console.log("Missing Asset:" + asset + " Not Found Anywhere!!");
				}
				deferred_fun.resolve(true);
			});
			
		}
		else{
			deferred_fun.resolve(true);
		}
	});
	return deferred_fun.promise;
}


function addToTraceAndNotify(asset,gateway,message_alert,username){

	var array_cId = [{"consumerId" : username}];
	console.log(username);
	var deferred = Q.defer();
	db.get(asset, function(err,body){
		if(!err){
			
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
					"alert": message_alert,
					"url": "http://www.google.com"
				};

				/********************************************************************
				*******************************ALERT*********************************
				*********************************************************************/
				push.sendNotificationByConsumerId(message,array_cId,null).then(function (response) {
					console.log("Notification sent successfully to all devices.");
				}, function(err) {
					console.log("Failed to send notification to all devices.");
					console.log(err);
				});	
				
				insertToDb(asset_json, asset).then(function(){
					deferred.resolve(true);
				});
			}
		}
		else{
			deferred.resolve(true);
		}	
	});
	return deferred.promise;
};



function userCheckLists(username){
	console.log("User:");
	var deferredUser = Q.defer();

	db.get(username, function(err, bodyUsername){

		if(!err){
			var promisesChecklist = [];
			var checklists = bodyUsername.checklists;

			console.log("Checklist Started:");
			var promisesChecklists = [];
			checklists.forEach(function(checklist,checklistIndex){
				var promisecheckChecklist = Q.defer();
				checkCheckList(checklist,username).then(function(){
					promisecheckChecklist.resolve(true);
				});
				promisesChecklists.push(promisecheckChecklist.promise);
			});
			Q.all(promisesChecklists).then(function(){
				deferredUser.resolve("User Done");
				console.log("User Done!!");
			});	
		}
		else{
			deferredUser.resolve("User Error");
		}

	});
	return deferredUser.promise;
};


function loopUsers(){
	console.log("\n\nLoop Started:\n\n");
	var promisesLoop = [];
	var promisesX = [];
	var deferredFun = Q.defer();

	db.get("data",function(err,body){
		if(!err){
			globalData = body;
			//console.log(JSON.stringify(globalData));
			var gateways = globalData.gateways;
			getGatewaysFromIOT().then(function(data){
				//console.log(data);
				//console.log(gateways);
				var diffGateways = data.difference(gateways);
				
				globalData.gateways = globalData.gateways.concat(diffGateways);
				if (diffGateways.length !== 0)
					insertToDb(globalData,"data");
			});
			
			gateways.forEach(function (gateway, gatewayIndex){
				var deferredPromise = Q.defer();
				assetListFromGateway(gateway).then(function(data){
					deferredPromise.resolve(true);
				});
				promisesX.push(deferredPromise.promise);
			});

			Q.all(promisesX).then(function(data){
				var listOfUsers = globalData.users;
				listOfUsers.forEach(function(username,userIndex){
					var deferredLoop = Q.defer();
					userCheckLists(username).then(function(data){
						deferredLoop.resolve(true);
					});
					promisesLoop.push(deferredLoop.promise);
				});
				Q.all(promisesLoop).then(function(data){
					deferredFun.resolve(true);
				});
			});	
		}
		else{
			console.log("No User registered. " + err);
			deferredFun.resolve(true);
		}
		
	});
	deferredFun.promise.then(function(data){
		console.log("\n\nLoop Done!\n\n");
		loopUsers();
	});
};

var debug = true;
if (debug){
	loopUsers();
}

function getGatewaysFromIOT(){
	var deferred = Q.defer();
	var options = {
	  url: 'http://'+org+'.internetofthings.ibmcloud.com/api/v0001/devices',
	  headers: {
	  	'Authorization': 'Basic ' + new Buffer(user + ':' + pass).toString('base64')
	  }
	}

	request(options, function(error, response, html){
		response.body = JSON.parse(response.body);
		var gateways = [];
		for (var i=0; i < response.body.length; i++){
			gateways.push(response.body[i].id);
		}
		deferred.resolve(gateways);
	});
	
	return deferred.promise;
}

//Posetively insert data
function insertToDb(jsn,name){
	//console.log("Trying");
	var deferred = Q.defer();
	db.get(name,function(error,body){
		if(!error){
			jsn._rev = body._rev;
		}
		db.insert(jsn,name,function(err,body){
			if(err)
				console.log("Conflict");
			else
				console.log("Inserted");
			deferred.resolve(err);
		});
	});
	var ret = deferred.promise.then(function(error){
		if(error)
			return insertToDb(jsn,name);
		else{
			return Q(true);
		}	
	});
	return ret;
};


// var jsn = {
// 	"Num": 5
// };
// insertToDb(jsn,"test2");


		
 //var a = geojson.pointInPolygon({"type":"Point","coordinates":[13,77,0]},{"type":"Polygon", "coordinates":[[[0,0],[6,0],[6,6],[0,6]]]})


//var a = geojson.pointInPolygon({"type":"Point","coordinates":[13,77,0]},{"type":"Polygon", "coordinates":[[[0,0],[6,0],[6,6],[0,6]]]})

// console.log(a);


// start server on the specified port and binding host
/*app.listen(appEnv.port, appEnv.bind, function() {
=======

Array.prototype.difference = function(e) {
	return this.filter(function(i) {return e.indexOf(i) < 0;});
};

app.listen(appEnv.port, appEnv.bind, function() {
>>>>>>> 27f8daa4ae97868f4cd5d6e9f3c5fe7ffcc08c59
	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});*/

var server = app.listen(6001, '0.0.0.0', function() {
  console.log('Listening on port %d', server.address().port);
});
