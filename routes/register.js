var express = require('express');
var router = express.Router();


router.use(function log(req, res, next){
  next();
});

router.get('/', function(req, res){
	res.render('register');
});

router.post('/', function(req, res){
	if (req.body.password === req.body.confirm_password){
		var user_json = {
			"password": req.body.password,
			"checklist": []
		}
		db.insert(user_json,req.body.username,function(err,body){
			if(!err)
				console.log("Inserted!!");
		})
		db.get("data",function(err,body){
			if(!err){
				body.users.push(req.body.username);
			}
		});
		//res.render()

	}
	

});

router.post('/check',function(req, res){
	// console.log("HETE");
	var username = req.body.username;
	db.get(username, function(err,body){
		if(err){
			res.send(true);
			console.log("1111");
		}
			
		else{
			res.send(false);
			console.log("2222");
		}
		console.log(JSON.stringify(body));	

	});
});
module.exports = router;