var express = require('express');
var router = express.Router();
//var session_data;

router.use(function log(req, res, next){
  next();
});



router.get('/', function(req, res){
	req.session.destroy(function(err){
		if(err){
			console.log(err);
		}	
		else{
			res.redirect('login');
		}
	});
	
});

module.exports = router;