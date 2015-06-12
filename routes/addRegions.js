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
  res.send("Got a POST request!");


  console.log(req.body);
  var alldata;

  db.get("data", function(err, body){
  	alldata = body;
  	var rev;

  	

  	if(typeof body != "undefined"){

  		console.log("if chala");

  		rev = body._rev;

  		var regionList = alldata.regions.concat(req.body.regions)
  		var json = {"assets": alldata.assets, 
        					"gateways": alldata.gateways,
        					"regions": regionList,
        					"users": alldata.users
		};

  		db.destroy("data", rev, function(err, body){
  			if(!err){ 	
  				console.log("deleted");			
  				db.insert(json, "data", function(err, body, header){
  					console.log("inserted");
  				});
  			}
  		});
  	}

  	else{

  		console.log("else chala");
  		var json = {"assets": "", 
        					"gateways": "",
        					"regions": req.body.regions,
        					"users": ""
		};

		db.insert(json, "data", function(err, body, header){
			console.log("inserted");
		});

  	}

  });

});

module.exports = router;