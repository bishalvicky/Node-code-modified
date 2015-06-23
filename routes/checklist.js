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
	request('http://localhost:6001/checklistEndPoint', function(error, response, html){
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
});

module.exports = router;