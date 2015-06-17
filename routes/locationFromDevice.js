var express = require('express');
var router = express.Router();


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
			console.log("Fetching trace");



			allTrace = allTrace.concat(body.trace);

			console.log(allTrace);

			res.render('traceMap', {title:"Home page TW", content: allTrace});

		}


	});


});

module.exports = router;