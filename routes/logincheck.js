var express = require('express');
var router = express.Router();
//var session_data;

router.use(function log(req, res, next){
  next();
});

router.get('/', function(req, res){
});

router.post('/', function(req, res){

	var username = req.body.username;
	var password = req.body.password;
	db.get(username, function(err, body){
		//Check password
		if(!err){
			if (password === body.password){
				res.send({"status":true});
			}
			else{
				res.send({"status":false,"error":"Username-Password mismatch!"});
			}
		}
		else{
			var data = {
				"status":false,
				"error":"User doesn't exist!"
			};
			res.send((data));
		}
	});
});

module.exports = router;