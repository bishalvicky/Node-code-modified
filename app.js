
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

					//if asset present in this gateway
					if (body.assets.indexOf(asset) > - 1){
						//console.log(asset+" is present in "+gateways[gatewayIndex]);
						assetsPresent[assetIndex] = true;
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
				if (!assetBoolean){
					console.log(assets[assetBooleanIndex]+" is missing!!!!!!!!!");
					checkInOtherRegions(assets[assetBooleanIndex]);

				}
			});
			
		});
	});
}

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
	//console.log("Shubham");
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
setInterval(function(){
	main();
},2000);

// start server on the specified port and binding host
app.listen(appEnv.port, appEnv.bind, function() {
	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
