var express = require('express');
var router = express.Router();
var Q = require('q');
var request = require('request');

router.use(function log(req, res, next){
  next();
});

router.post('/', function(req, res){
});

router.get('/', function(req, res){

	var assetName = req.query.assetName;

	console.log(assetName);

	var allTrace = [];

	var bool = true;

	db.get(assetName, function(err, body){
		if(err){
			console.log("No such asset exists");
			res.send("No such asset exists");
		}
		else{

			var assetTrace = body.trace;

			var oneDayFromNow = Date.now() - 86400000;
			//var oneDayFromNow  = 1436425565815;

			var startIndex = 0;
			for(var i=0; i<assetTrace.length; i++){
				if(assetTrace[i].timestamp > oneDayFromNow && startIndex === 0 && i > 0){
					startIndex = i-1;
				}
			}

			var assetTrace = [];
			for(var i=startIndex; i<body.trace.length; i++)
				assetTrace.push(body.trace[i]);

			var allTrace = [];

			var promises = [];

			assetTrace.forEach(function(item, j){

				var i = j + startIndex;

				if(assetTrace[i].gateway !== 'Missing'){

					var deferredFor = Q.defer();
					var gatewayName = assetTrace[i].gateway;
					var startTime;

					if(i === 0)
						startTime = oneDayFromNow; //one day from now					
					else
						startTime = assetTrace[i].timestamp;
					

					var endTime;

					if(i < assetTrace.length - 1)
						endTime = assetTrace[i+1].timestamp;
					else
						endTime = Date.now();

					var mapInfo = [];

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
								console.log("else chal gya: " + mapInfo[0]);
								populate(mapInfo, allTrace);
								deferredFor.resolve(allTrace);
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

							populate(mapInfo, allTrace);
							deferredFor.resolve(allTrace);

							console.log(allTrace);
						}
					});
					promises.push(deferredFor.promise);
				}

			});

			Q.all(promises).then(function(data){

				var temper = allTrace.sort(function(a,b){ return a.timestamp-b.timestamp });
				console.log("temper :"+ allTrace);
				
				if (typeof allTrace[0] === "undefined") 
					res.send("Trace empty: Nothing to plot");
				else 
					res.render('traceMap', {title: assetName, content: temper});
			});
		}
	});
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