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


  console.log(req.body);

  enterAssetsIntoData(req.body);

  createAssetDoc(req.body, res);

});

function enterAssetsIntoData(enteredInfo){
  var alldata;

  var assetId = enteredInfo.assetId;

  db.get("data", function(err, body){
    alldata = body;
    var rev;

    if(!err){
      console.log("data exists");
      var assetList = alldata.assets;

      if(assetList.indexOf(assetId) < 0){ // data does not already contain this asset
        console.log("asset does not exist in data");
        var assetList = assetList.concat(assetId);
        var json = {"assets": assetList, 
                    "gateways": alldata.gateways,
                    "regions": alldata.regions,
                    "users": alldata.users,
                    "_rev": alldata._rev
                    };

        db.insert(json, "data", function(err, body, header){
          if(!err)
            console.log("inserted");
        });
      }

      else{
        console.log("asset is in data");
      }
      

    }

    else{
      console.log("data file not exists");
      var json = {"assets": assetId, 
                  "gateways": "",
                  "regions": "",
                  "users": ""
                  };

      db.insert(json, "data", function(err, body, header){
        if(!err)
          console.log("inserted");
      });

    }
  });

};

function createAssetDoc(enteredInfo, res){
  var assetName = enteredInfo.assetName;
  var assetId = enteredInfo.assetId;
  var assetType = enteredInfo.assetType;

  db.get(enteredInfo.assetId, function(err, body){
    var json;

    if(!err){ // asset already exists
      console.log(enteredInfo.assetId + " asset exists")  

      json = {"name": assetName,
              "type": assetType, 
              "rules": "",
              "trace": [],
              "_rev": body._rev
      };

    }

    else{ // new asset
      console.log(enteredInfo.assetId + " new asset")

      json = {"name": assetName,
              "type": assetType, 
              "rules": "",
              "trace": []
      };

    }

    db.insert(json, enteredInfo.assetId, function(err, body, header){
      if(!err) {
        console.log(enteredInfo.assetId + " inserted");
        res.send("true");
      }
      else{
        res.send("false");
      }
    });

  });

};

module.exports = router;