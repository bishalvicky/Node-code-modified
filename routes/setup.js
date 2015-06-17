var express = require('express');
var router = express.Router();
var request = require('request');
var gateway = "gateway_8cd1c39d10f0";
var user = "a-jq3b5v-nyywcig5q2";
var pass = "vAlx3YAaFY2xJ!8*Gf";

var str="";
var Q = require('q');
var pages = 1;

router.use(function log(req, res, next){
  next();
});

router.get('/', function(req, res){
	var mapInfo = [];
	var endTime = Date.now();
	var oneDay = 86400000;
	var oneMinute = 60000;
	var startTime = endTime - oneDay;

	function getTrace(cursorId, cookie){
		console.log("getTrace");
		var deferred = Q.defer();
		var options = {
		  url: 'https://jq3b5v.internetofthings.ibmcloud.com/api/v0001/historian/JavaDevice/'+gateway+'?start='+startTime+'&end='+endTime,
		  headers: {
		  	'Authorization': 'Basic ' + new Buffer(user + ':' + pass).toString('base64'),
		  	'cursorId': cursorId,
		  	'Cookie': cookie
		  },  
		}
		
		request(options, function(error, response, html){
			pages++;
			res.write(html+"\n\n\n\n\n\n");
			mapInfo.push(JSON.parse(html));
			//str += html+"<br><br><br><br><br>";
			cursorId = response.headers.cursorid;
			var data = {
				'cursorId': cursorId,
				'cookie': cookie
			};
			deferred.resolve(data);
		});

		deferred.promise.then(function(data){
			if (typeof data['cursorId'] !== "undefined"){
				console.log(pages);
				getTrace(data['cursorId'], data['cookie']);
			}
			else {
				console.log(mapInfo[0]);
				response.end("");
			}
		});
	}

	var options = {
	  url: 'https://jq3b5v.internetofthings.ibmcloud.com/api/v0001/historian/JavaDevice/'+gateway+'?start='+startTime+'&end='+endTime,
	  headers: {
	  	'Authorization': 'Basic ' + new Buffer(user + ':' + pass).toString('base64') 
	  }
	}


	request(options, function(error, response, html){
		var cursorId = response.headers.cursorid;
		var cookie = response.headers['set-cookie'][0];
		res.write(html+"\n\n\n\n\n\n");
		mapInfo.push(JSON.parse(html));

		if (typeof cursorId !== "undefined"){
			getTrace(cursorId, cookie);
		}
		else {
			console.log(mapInfo[0]);
			res.end("");

		}
		//var str = JSON.parse(html);
	});
});

router.post('/', function(req, res){
  res.send("Got a POST request!");
});

module.exports = router;