var express = require('express');
var router = express.Router();


router.use(function log(req, res, next){
  next();
});

router.get('/', function(req, res){
	res.render('traceMap',{
		title:"Home page TW", 
		content: "Hello World"
	});
});

router.post('/', function(req, res){
	//var latitude = req.body.latitude;
	//var longitude = req.body.longitude;
	//var altitude = req.body.altitude;
  res.send("Got a POST request!");

});

module.exports = router;