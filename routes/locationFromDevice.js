var express = require('express');
var router = express.Router();
var request = require('request');

router.use(function log(req, res, next){
  next();
});

router.get('/', function(req, res){
	session_data = req.session;
	if(session_data.username){

		var url = req.protocol + '://' + req.get('host') + '/locationFromDeviceEndPoint';
		var trace = null;
		if (req.query.assetName){
			url = url + '?assetName=' + req.query.assetName;
		}

		var options = {
		  url: url,
		  headers: {
		  	'Authorization': 'Basic ' + new Buffer(session_data.username + ':' + session_data.password).toString('base64')
		  }
		}

		request(options, function(error, response, html){
			response.body = JSON.parse(response.body);
			res.render('traceMap',{
				title: response.body.title,
				content: response.body.content
			});
		});
	}
	else
		res.redirect('login');
});

router.post('/', function(req, res){

});

module.exports = router;