/*jshint node:true*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as it's web server
// for more info, see: http://expressjs.com

var express = require('express');
var cfenv = require('cfenv');
var fs = require('fs');
var app = express();
var db;
var cloudant;
var dbCredentials = {
	dbName : 'nodered'
};

var insertdb = require('./routes/insertdb');
app.use('/insertdb',insertdb);
app.use(express.static(__dirname + '/public'));
var appEnv = cfenv.getAppEnv();

function initDBConnection() {
	if(process.env.VCAP_SERVICES) {
		var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
		if(vcapServices.cloudantNoSQLDB) {
			dbCredentials.host = vcapServices.cloudantNoSQLDB[0].credentials.host;
			dbCredentials.port = vcapServices.cloudantNoSQLDB[0].credentials.port;
			dbCredentials.user = vcapServices.cloudantNoSQLDB[0].credentials.username;
			dbCredentials.password = vcapServices.cloudantNoSQLDB[0].credentials.password;
			dbCredentials.url = vcapServices.cloudantNoSQLDB[0].credentials.url;
		}
		console.log('VCAP Services: '+JSON.stringify(process.env.VCAP_SERVICES));
	}
  else{
    dbCredentials.host = "3153afa5-0cea-45e3-b78b-fedf80e77701-bluemix.cloudant.com";
		dbCredentials.port = 443;
		dbCredentials.user = "3153afa5-0cea-45e3-b78b-fedf80e77701-bluemix";
		dbCredentials.password = "336681a9347396c3405180fbcb1289e747644e84c35449b525e9c72038e9b605";
		dbCredentials.url = "https://3153afa5-0cea-45e3-b78b-fedf80e77701-bluemix:336681a9347396c3405180fbcb1289e747644e84c35449b525e9c72038e9b605@3153afa5-0cea-45e3-b78b-fedf80e77701-bluemix.cloudant.com";    
  }

	cloudant = require('cloudant')(dbCredentials.url);
	
	//check if DB exists if not create
	cloudant.db.create(dbCredentials.dbName, function (err, res) {
		//if (err) { console.log('could not create db ', err); }
    });
	db = cloudant.use(dbCredentials.dbName);
}

initDBConnection();


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
				  		if (!err)
				  			console.log(docid + " Destroyed");
				  	});
				  }

				  db.insert(obj, docid, function(err, body, header) {
						if (err)
							return console.log('[' + docid + '.insert] ', err.message);
					  console.log('Inserted in '+docid);
					});
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

createDoc("assets");
createDoc("checklist");
/*


db.insert({crazy: true}, 'gateways', function(err, body, header) {
	if (err)
		return console.log('[alice.insert] ', err.message);
  console.log('you have inserted the rabbit.');
  console.log(body);
});

db.insert({crazy: true}, 'checklist', function(err, body, header) {
	if (err)
		return console.log('[alice.insert] ', err.message);
  console.log('you have inserted the rabbit.');
  console.log(body);
});
*/

// start server on the specified port and binding host
app.listen(appEnv.port, appEnv.bind, function() {
	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
