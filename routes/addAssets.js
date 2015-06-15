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

  enterAssetsIntoData(req.body);

  createAssetDoc(req.body);

});

function enterAssetsIntoData(enteredInfo){

  var alldata;

  db.get("data", function(err, body){
    alldata = body;
    var rev;

    if(typeof body != "undefined"){

      console.log("if chala");

      rev = body._rev;

      var assetList = alldata.assets.concat(enteredInfo.assets)
      var json = {"assets": assetList, 
                  "gateways": alldata.gateways,
                  "regions": alldata.regions,
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
      var json = {"assets": enteredInfo.assets, 
                  "gateways": "",
                  "regions": "",
                  "users": ""
      };

      db.insert(json, "data", function(err, body, header){
        console.log("inserted");
      });

    }

  });
};

function createAssetDoc(enteredInfo){

  var ListOfAssets = enteredInfo.assets;
  var typeList = enteredInfo.type;

  ListOfAssets.forEach(function(item,j){

    var json = {"type": typeList[j], 
                "rules": "",
                "trace": []
    };

    db.get(ListOfAssets[j], function(err, body){

      if(typeof body != "undefined"){

        console.log("create ka if chala");
        var rev = body._rev;

        db.destroy(ListOfAssets[j], rev, function(err, body){
          if(!err){   
            console.log("asset deleted"); 
            db.insert(json, ListOfAssets[j], function(err, body, header){
              if(!err) console.log("asset inserted");
            });
          }
        });
      }

      else{

        console.log("create ka else chala");

        db.insert(json, ListOfAssets[j], function(err, body, header){
          if(!err) console.log("asset inserted");
        });

      }
    });
  });
};

module.exports = router;