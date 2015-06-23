var express = require('express');
var router = express.Router();
var Q = require('q');
var request = 	require('request');

var username = "skjindal93";
var password = "hehe";

router.use(function log(req, res, next){
  next();
});

router.get('/', function(req, res){
	request('http://localhost:6001/checklistEndPoint', function(error, response, html){
		res.render('addChecklist',{
			title: "Checklist",
			content: response.body
		});
	});
});

router.post('/', function(req, res){
	console.log(req.body);

	var options = {
		url:'http://localhost:6001/checklistEndPoint', 
		form: {data:req.body}
	};
	console.log(options);

	request.post(options, function(request, response){
		res.render('addChecklist',{
			title: "Checklist",
			content: response.body
		});
	});
	
	
	
	
});

module.exports = router;