var express = require('express');
var router = express.Router();
var Q = require('q');
var request = require('request');

router.use(function log(req, res, next){
  next();
});

var username = "skjindal93";
var password = "hehe";


//Arguments:
//1. checklistIndex as of now
//2. region name
//3. asset name

router.get('/', function(req, res){
	/*getChecklists(false, false, false).then(function(checklists){

		res.render('checklist',{
			title: "Checklist",
			content: checklists
		});

	});*/
	console.log(req.query);
	var url = 'http://localhost:6001/checklistEndPoint';
	
	if (req.query.alll)
		url = url + '?alll=' + req.query.alll;
	else if (req.query.checklist)
		url = url + '?checklist=' + req.query.checklist;
	else if (req.query.region)
		url = url + '?region=' + req.query.region;
	else if (req.query.asset)
		url = url + '?asset=' + req.query.asset;

	request(url, function(error, response, html){

		res.render('checklist',{
			title: "Checklist",
			content: response.body
		});
	});
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