var express = require('express');
var router = express.Router();
//var session_data;

router.use(function log(req, res, next){
  next();
});



router.get('/', function(req, res){
	session_data = req.session;
	if(session_data.username){
		res.redirect('checklist');
	}
	else{
		res.render('login',{
			error: null
		});
	}
	
});

router.post('/', function(req, res){

	session_data = req.session;
	console.log(session_data);
	var username = req.body.username;
	var password = req.body.password;
	db.get(username, function(err, body){
		//Check password
		if(!err){
			if (password === body.password){
				
				session_data.username = username;
				console.log(req.session);
				req.session.save();
				res.redirect('checklist');		


			}
			else{
				res.render('login',{
					error: "Username and password missmatch!"
				});
			}
		}
		else{
			res.render('login',{
				error: "User doesn't exist!"
			});
		}
	});

	
	

});


module.exports = router;