var express = require('express');
var router = express.Router();
var Q = require('q');
var request = require('request');
var user = "a-jq3b5v-nyywcig5q2";
var pass = "vAlx3YAaFY2xJ!8*Gf";

router.use(function log(req, res, next){
  next();
});

router.get('/', function(req, res){
	
});

router.post('/', function(req, res){
	//var latitude = req.body.latitude;
	//var longitude = req.body.longitude;
	//var altitude = req.body.altitude;
	//res.send("Got a POST request!");

	var assetName = req.body.assetName;

	console.log(assetName);

	var allTrace = [];

	var bool = true;

	db.get(assetName, function(err, body){
		if(typeof body === "undefined"){
			console.log("No such asset exists");
			res.send("No such asset exists");
		}

		else{
			if(body.type === "gps"){
			//if(bool){

				console.log("bool is true");
				var gatewayName = assetName.split("_");
				gatewayName = "gateway_" + gatewayName[1];

				//gatewayName = "gateway_8cd1c39d10f0";

				var mapInfo = [];
				var endTime = Date.now();
				var oneDay = 86400000;
				var oneMinute = 60000;
				var startTime = endTime - oneDay;

				function getTrace(cursorId, cookie){
					console.log("getTrace");
					var deferred = Q.defer();
					var options = {
					  url: 'https://jq3b5v.internetofthings.ibmcloud.com/api/v0001/historian/JavaDevice/'+gatewayName+'?start='+startTime+'&end='+endTime,
					  headers: {
					  	'Authorization': 'Basic ' + new Buffer(user + ':' + pass).toString('base64'),
					  	'cursorId': cursorId,
					  	'Cookie': cookie
					  },  
					}
					
					request(options, function(error, response, html){
						pages++;
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
							response.end("");
						}



					});
				}

				var options = {
				  url: 'https://jq3b5v.internetofthings.ibmcloud.com/api/v0001/historian/JavaDevice/'+gatewayName+'?start='+startTime+'&end='+endTime,
				  headers: {
				  	'Authorization': 'Basic ' + new Buffer(user + ':' + pass).toString('base64') 
				  }
				}

				request(options, function(error, response, html){

					//console.log(response.headers);

					var cursorId = response.headers.cursorid;
					var cookie = response.headers['set-cookie'][0];

					//console.log("cursorId: "+cursorId);

					//console.log("cookie: "+cookie);

					//res.write(html+"\n\n\n\n\n\n");

					//console.log("html: "+html);
					mapInfo.push(JSON.parse(html));

					if (typeof cursorId !== "undefined"){
						getTrace(cursorId, cookie);
					}
					else {
						console.log("cursorId undef: "+mapInfo[0]);

						var allTrace = [];

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

						console.log(allTrace);

						var temper = allTrace.sort(function(a,b){ return a.timestamp-b.timestamp });

						//console.log("sorted: "+JSON.stringify(temper));

						//console.log("temper :"+allTrace);

						if(typeof allTrace[0] === "undefined") res.send("Trace empty: Nothing to plot");
						else res.render('traceMap', {title: assetName, content: temper});


						//res.end("");

					}
					//var str = JSON.parse(html);
				});

				
				console.log("yahaanaaa");

			}

			else{

				console.log("bool is false");

				var assetTrace = body.trace;
				console.log("Fetching trace: "+ assetTrace);
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
							console.log("during run: "+JSON.stringify(allTrace));
						}

						else{
							deferred.resolve(allTrace);
							console.log("missing");					}
					});
					promises.push(deferred.promise);
				});

				Q.all(promises).then(function(data){

					//console.log("Promises: "+JSON.strigify(allTrace));

					console.log("Hehe");

					//console.log("data: "+data);

					var temper = allTrace.sort(function(a,b){ return a.timestamp-b.timestamp });

					//console.log("sorted: "+JSON.stringify(temper));

					console.log("temper :"+allTrace);

					if(typeof allTrace[0] === "undefined") res.send("Trace empty: Nothing to plot");
					else res.render('traceMap', {title: assetName, content: temper});
				});

			}

		}

	});

});

module.exports = router;