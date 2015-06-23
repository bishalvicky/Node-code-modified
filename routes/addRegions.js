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


  console.log("android APPPP: "+req.body);

  //enterRegionsIntoData(req.body);

  //createRegionDoc(req.body);
  

});


function enterRegionsIntoData(enteredInfo){
  var alldata;

  db.get("data", function(err, body){
    alldata = body;
    var rev;

    if(typeof body != "undefined"){

      console.log("if chala");

      rev = body._rev;

      var regionList = alldata.regions.concat(enteredInfo.regions)
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
                  "regions": enteredInfo.regions,
                  "users": ""
      };

      db.insert(json, "data", function(err, body, header){
        console.log("inserted");
      });
    }
  });
};


function createRegionDoc(enteredInfo){

  var listOfRegions = enteredInfo.regions;
  var gatewayList = enteredInfo.gateways;

  listOfRegions.forEach(function(item,j){

    var listOfGates = gatewayList[j].split(",");

    var json = {"type": "Polygon",
                "coordinates": [],
                "gateways": listOfGates
    };

    db.get(listOfRegions[j], function(err, body){

      if(typeof body != "undefined"){

        console.log("create ka if chala");
        var rev = body._rev;

        db.destroy(listOfRegions[j], rev, function(err, body){
          if(!err){   
            console.log("region deleted"); 
            db.insert(json, listOfRegions[j], function(err, body, header){
              if(!err) console.log("region inserted");
            });
          }
        });
      }

      else{

        console.log("create ka else chala");

        db.insert(json, listOfRegions[j], function(err, body, header){
          if(!err) console.log("region inserted");
        });

      }
    });
  });
};

module.exports = router;