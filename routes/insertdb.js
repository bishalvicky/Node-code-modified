var express = require('express');
var router = express.Router();
var fs = require('fs'); 

function createDoc(docid){
	var obj;
	fs.readFile('./data/' + docid + '.json', 'utf8', function (err, data) {
	  if (err) throw err;
	  obj = JSON.parse(data);

	  var rev;
	  db.get(docid, { revs_info: true }, function(err, body) {
		  if (!err){
		  		//Getting revision number of assets document
		    	
		    	rev = body._rev;
		    	
		    	//Deleting if rev exists
		    	if (typeof rev !== "undefined"){
				  	db.destroy(docid, rev, function(err, body){
				  		if (!err){
				  			console.log(docid + " Destroyed");
				  			db.insert(obj, docid, function(err, body, header) {
									if (err)
										return console.log('[' + docid + '.insert] ', err.message);
								  console.log('Inserted in '+docid);
								});
				  		}
				  	});
				  }
		  	}
		  else {
		  	//Inserting the assets data from assets.json file
				db.insert(obj, docid, function(err, body, header) {
					if (err)
						return console.log('[' + docid + '.insert] ', err.message);
					console.log('Inserted in '+docid);
				});
		  }
		});
	});
};


router.use(function log(req, res, next){
  console.log("InsertDB");
  next();
});

router.get('/', function(req, res){

  res.send("GET request!");
  
  //Assets
	createDoc("asset_5cd2c39d10f0");
	createDoc("asset_6cd2c39d10f0");
	createDoc("asset_7cd2c39d10f0");
	createDoc("asset_8cd2c39d10f0");
	createDoc("asset_9cd2c39d10f0");
	createDoc("asset_7cd1c39d10f0");
	createDoc("asset_8cd1c39d10f0");
	createDoc("asset_9cd1c39d10f0");

	//Checklist
	createDoc("skjindal93");

	//Gateways
	createDoc("gateway_7cd1c39d10f0");
	createDoc("gateway_8cd1c39d10f0");
	createDoc("gateway_9cd1c39d10f0");

	//Regions
	createDoc("region_1");
	createDoc("region_2");

	//Data
	createDoc("data")

});

router.post('/', function(req, res){
  res.send("Got a POST request!");
});

module.exports = router;
