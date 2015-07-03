var express = require('express');
var router = express.Router();


router.use(function log(req, res, next){
  next();
});

router.get('/', function(req, res){
	session_data = req.session;
	if(session_data.username){
		res.redirect('checklist');
	}
	else
		res.render('register');
	
});

router.post('/', function(req, res){
	var username = req.body.username;
	if (req.body.password === req.body.confirm_password){
		var user_json = {
			"password": req.body.password,
			"checklist": []
		}
		
		db.get("data", function(err,body){
			if(!err){
				if(body.users.indexOf(username)<0){
					body.users.push(username);
					db.insert(body,"data",function(err,body){
						console.log("Data Updated");
						db.insert(user_json, username,function(err,body){
							console.log("Inserted")
						});
					});
				}
			}
			else{
				var data_json = {
					"assets": [],
				  "gateways": [],
				  "regions": [],
				  "users": [username]
				};
				
			  db.insert(data_json, "data", function(err,body){
					console.log("Data Created");
					db.insert(user_json, username, function(err,body){
						console.log("Inserted")
					});
				});
			}
		});

		res.redirect('login');

	}
	else{
		res.redirect('register');
	}
	

});

router.post('/check',function(req, res){
	// console.log("HETE");
	var username = req.body.username;
	db.get("data", function(err,body){
		if(!err){
			var users = body.users;
			if(users.indexOf(username)<0)
				res.send(true);
			else
				res.send(false);
		}
	});
});
module.exports = router;