var express = require('express');
var router = express.Router();
var Q = require('q');

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

	db.get(assetName, function(err, body){
		if(typeof body == "undefined"){
			console.log("No such asset exists");
		}

		else{

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
						//console.log("during run: "+JSON.stringify(allTrace));
					}

					else{
						deferred.resolve(allTrace);
					}
				});
				promises.push(deferred.promise);
			});

			Q.all(promises).then(function(data){
				console.log("Promises: "+JSON.strigify(allTrace));
				//console.log("data: "+data);

				var temper = allTrace.sort(function(a,b){ return a.timestamp-b.timestamp });

				console.log("sorted: "+JSON.stringify(temper));

				res.render('traceMap', {title: assetName, content: allTrace});
			});

		}

	});

});

module.exports = router;