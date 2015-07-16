var express = require('express');
var router = express.Router();
var Q = require('q');
var request = require('request');

router.use(function log(req, res, next){
  next();
});

router.get('/', function(req, res){

	functions.checkBasicAuthentication(req).then(function(data){
		var authData = JSON.parse(data);
		if (authData.status){
			var assetName = req.query.assetName;
			var allTrace = [];
			var bool = true;

			db.get(assetName, function(err, body){
				if(typeof body === "undefined"){
					console.log("No such asset exists");
					res.send("No such asset exists");
				}
				else{
					console.log("Asset is type GPS");

					if(body.type === "GPS"){
						var gatewayName = assetName.split("_");
						gatewayName = "gateway_" + gatewayName[1];

						var mapInfo = [];
						var endTime = Date.now();
						var oneDay = 86400000;
						var oneMinute = 60000;
						var startTime = endTime - oneDay;

						function getTrace(cursorId, cookie){
							console.log("getTrace");
							var deferred = Q.defer();
							var options = {
							  url: 'https://'+org+'.internetofthings.ibmcloud.com/api/v0001/historian/Pi/'+gatewayName+'?start='+startTime+'&end='+endTime,
							  headers: {
							  	'Authorization': 'Basic ' + new Buffer(user + ':' + pass).toString('base64'),
							  	'cursorId': cursorId,
							  	'Cookie': cookie
							  },  
							}
							
							request(options, function(error, response, html){
								
								//res.write(html+"\n\n\n\n\n\n");
								mapInfo.push(JSON.parse(html));
								//str += html+"<br><br><br><br><br>";
								cursorId = response.headers.cursorid;
								var data = {
									'cursorId': cursorId,
									'cookie': cookie
								};
								deferred.resolve(data);
							});

							deferred.promise.then(function(data){
								if (typeof data['cursorId'] !== "undefined"){							
									getTrace(data['cursorId'], data['cookie']);
								}
								else {
									console.log("else chal gya: " +mapInfo[0]);
									populate(mapInfo, allTrace);
									response.end("");
								}
							});
						}

						var options = {
						  url: 'https://'+org+'.internetofthings.ibmcloud.com/api/v0001/historian/Pi/'+gatewayName+'?start='+startTime+'&end='+endTime,
						  headers: {
						  	'Authorization': 'Basic ' + new Buffer(user + ':' + pass).toString('base64') 
						  }
						}

						request(options, function(error, response, html){
							var cursorId = response.headers.cursorid;
							var cookie = response.headers['set-cookie'][0];

							mapInfo.push(JSON.parse(html));

							if (typeof cursorId !== "undefined"){
								getTrace(cursorId, cookie);
							}
							else {
								console.log("cursorId undef: "+mapInfo[0]);
								var allTrace = [];

								populate(mapInfo, allTrace);

/*
								for(var k=0; k<mapInfo.length; k++){
									for(var j=0; j<mapInfo[k].length; j++){

										var lat = mapInfo[k][j].evt.latitude;
										var lng = mapInfo[k][j].evt.longitude;
										var alti = mapInfo[k][j].evt.altitude;

										var element = {
											"coordinates": [lat, lng, alti],
											"timestamp": mapInfo[k][j].timestamp.$date
										};

										allTrace = allTrace.concat(element);
									}
								}
*/
								console.log(allTrace);
								var temper = allTrace.sort(function(a,b){ return a.timestamp-b.timestamp });
								
								if (typeof allTrace[0] === "undefined") 
									res.send({title: assetName, content: "Trace empty: Nothing to plot"});
								else
									res.send({title: assetName, content: temper});
							}
						});
					}
					else{
						console.log("Asset is not GPS");

						var assetTrace = body.trace;
						console.log("Fetching trace: "+ JSON.stringify(assetTrace));
						var promises = [];
						assetTrace.forEach(function(item, i){

							var getGateway = assetTrace[i].gateway;
							var deferred = Q.defer();
							db.get(getGateway, function(err, gatebody){
								
								if(!err){
									var coord = gatebody.coordinates;

									var element = {
								  	"coordinates": coord,
								   	"timestamp": assetTrace[i].timestamp
								  };

									allTrace = allTrace.concat(element);
									deferred.resolve(allTrace);
									//console.log("during run: "+ JSON.stringify(allTrace));
								}
								else{
									deferred.resolve(allTrace);
									console.log("missing");					
								}
							});
							promises.push(deferred.promise);
						});

						Q.all(promises).then(function(data){

							var temper = allTrace.sort(function(a,b){ return a.timestamp-b.timestamp });
							//console.log("temper :"+allTrace);
							
							if (typeof allTrace[0] === "undefined") 
								res.send({title: assetName, content: "Trace empty: Nothing to plot"});
							else 
								res.send({title: assetName, content: temper});
						});
					}
				}
			});
		}
	});
});

router.post('/', function(req, res){

});


function populate(fromArray, toArray){
	for(var k=0; k<fromArray.length; k++){
		for(var j=0; j<fromArray[k].length; j++){

			var lat = fromArray[k][j].evt.latitude;
			var lng = fromArray[k][j].evt.longitude;
			var alti = fromArray[k][j].evt.altitude;

			var element = {
							"coordinates": [lat, lng, alti],
							"timestamp": fromArray[k][j].timestamp.$date
						  };

			toArray = toArray.concat(element);
		}
	}
};


module.exports = router;