var express = require('express');
var router = express.Router();
var Q = require('q');
var request = require('request');

router.use(function log(req, res, next){
  next();
});

//var session_data;

//Arguments:
//1. checklistIndex as of now
//2. region name
//3. asset name

function getAssetLocation(asset){
	var deferred = Q.defer();

	db.get(asset, function(err, body){
		var length = body.trace.length;
		if (length !== 0)
			deferred.resolve(body.trace[length - 1]);
		else
			deferred.resolve(false);
	});

	return deferred.promise;
}

router.get('/', function(req, res){
	session_data = req.session;
	if(session_data.username){
		console.log(req.query);
		var url = 'http://localhost:6001/checklistEndPoint';
		var trace = null;

		if (req.query.alll)
			url = url + '?alll=' + req.query.alll;
		else if (req.query.checklist)
			url = url + '?checklist=' + req.query.checklist;
		else if (req.query.region)
			url = url + '?region=' + req.query.region;
		else if (req.query.asset){
			url = url + '?asset=' + req.query.asset;	
			getAssetLocation(req.query.asset).then(function(data){
				trace = data;
			});
		}

		request(url, function(error, response, html){

			res.render('checklist',{
				title: "Checklist",
				content: response.body,
				username: session_data.username,
				trace: trace
			});
		});
	}
	else
		res.redirect('login');
	
	/*res.render('checklist',{
		title: "Checklist",
		content: {"hello":"hello"}
	});*/
});

router.post('/', function(req, res){
	var options = {
		url:'http://localhost:6001/checklistEndPoint', 
		form: {data:req.body}
	};

	request.post(options, function(request, response){
		res.render('checklist',{
			title: "Checklist",
			content: response.body
		});
	});
});

module.exports = router;