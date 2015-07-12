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
			deferred.resolve('');
	});

	return deferred.promise;
}

router.get('/', function(req, res){
	session_data = req.session;
	if(session_data.username){
		console.log(req.query);
		var url = req.protocol + '://' + req.get('host') + '/checklistEndPoint';
		var options = {
		  url: url,
		  headers: {
		  	'Authorization': 'Basic ' + new Buffer(session_data.username + ':' + session_data.password).toString('base64')
		  }
		}
		var trace = null;

		if (req.query.alll)
			url = url + '?alll=' + req.query.alll;
		else if (req.query.checklist)
			url = url + '?checklist=' + req.query.checklist;
		else if (req.query.region)
			url = url + '?region=' + req.query.region;
		else if (req.query.asset){
			url = url + '?asset=' + req.query.asset;
		}
		console.log(url);

		request(options, function(error, response, html){
			if (req.query.asset){
				getAssetLocation(req.query.asset).then(function(data){
					trace = data;
					res.render('addChecklist',{
						title: "Checklist",
						content: response.body,
						username: session_data.username,
						trace: trace
					});
				});
			}
			else {
				res.render('addChecklist',{
					title: "Checklist",
					content: response.body,
					username: session_data.username,
					trace: ''
				});
			}
			
		});
	}
	else
		res.redirect('login');
});

router.post('/', function(req, res){
	if (session_data.username){
		var options = {
			url: req.protocol + '://' + req.get('host') + '/checklistEndPoint', 
			form: {data:req.body},
			headers: {
		  	'Authorization': 'Basic ' + new Buffer(session_data.username + ':' + session_data.password).toString('base64')
		  }
		};

		request.post(options, function(request, response){
			res.render('addChecklist',{
				title: "Checklist",
				content: response.body,
				trace: ''
			});
		});
	}
	else
		res.redirect('login');
});

module.exports = router;