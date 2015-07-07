var express = require('express');
var router = express.Router();


router.use(function log(req, res, next){
  next();
});

router.get('/', function(req, res){
  console.log("got a get request");

  var gatewayList;

  db.get("data", function(err, body){
    if(!err){
      gatewayList = body.gateways;
    }

    else{
      gatewayList = ["error aa gya"];

    }

    res.send(gatewayList);

    console.log("gateList sent: "+gatewayList);
  });
});

router.post('/', function(req, res){
	//var latitude = req.body.latitude;
	//var longitude = req.body.longitude;
	//var altitude = req.body.altitude;
  //res.send("Got a POST request!");

  console.log("got a post request");
  console.log("android APPPP: "+JSON.stringify(req.body));

  if(typeof req.body.regionName === "undefined"){ //list of gateways is requested 
    var gatewayList;

    db.get("data", function(err, body){
      if(!err){
        gatewayList = body.gateways;
      }

      else{
        gatewayList = ["No gateway exists"];

      }

      res.send(gatewayList);

      console.log("gateList sent: "+gatewayList);
    });
  }

  else{ // new region being registered

    enterRegionsIntoData(req.body);

    createRegionDoc(req.body);
  }
 

});


function enterRegionsIntoData(enteredInfo){
  var alldata;

  var regId = enteredInfo.regionId;

  db.get("data", function(err, body){
    alldata = body;
    var rev;

    if(!err){
      console.log("data exists");
      var regionList = alldata.regions;

      if(regionList.indexOf(regId) < 0){ // data does not already contain this region
        console.log("region does not exist in data");
        var regionList = regionList.concat(regId);
        var json = {"assets": alldata.assets, 
                    "gateways": alldata.gateways,
                    "regions": regionList,
                    "users": alldata.users,
                    "_rev": alldata._rev
                    };

        db.insert(json, "data", function(err, body, header){
          console.log("inserted");
        });
      }

      else{
        console.log("region is in data");
      }
      

    }

    else{
      console.log("data file not exists");
      var json = {"assets": "", 
                  "gateways": "",
                  "regions": regId,
                  "users": ""
                  };

      db.insert(json, "data", function(err, body, header){
        console.log("inserted");
      });

    }

/*

    if(typeof body != "undefined"){

      console.log("if chala");

      rev = body._rev;

      var regionList = alldata.regions.concat(enteredInfo.regionName)
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
                  "regions": enteredInfo.regionName,
                  "users": ""
      };

      db.insert(json, "data", function(err, body, header){
        console.log("inserted");
      });
    }

    */
  });


};

function createRegionDoc(enteredInfo){
  var regionName = enteredInfo.regionName;
  var regionId = enteredInfo.regionId;
  var gatewayList = enteredInfo.gateways;

  console.log(gatewayList)
;
  db.get(enteredInfo.regionId, function(err, body){
    var json;

    if(!err){ // region already exists
      console.log(enteredInfo.regionId + " region exists")
      json = {"name": enteredInfo.regionName,
              "type": "Polygon",
              "coordinates": enteredInfo.points,
              "altitudeLow": enteredInfo.altLow,
              "altitudeHigh": enteredInfo.altHigh,
              "gateways": gatewayList,
              "_rev": body._rev
      };     

    }

    else{ // new region
      console.log(enteredInfo.regionId + " new region")

      json = {"name": enteredInfo.regionName,
              "type": "Polygon",
              "coordinates": enteredInfo.points,
              "altitudeLow": enteredInfo.altLow,
              "altitudeHigh": enteredInfo.altHigh,
              "gateways": gatewayList,
      };

    }

    db.insert(json, enteredInfo.regionId, function(err, body, header){
      if(!err) console.log(enteredInfo.regionId + " inserted");
    });

  });

};

/*
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
*/
module.exports = router;