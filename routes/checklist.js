var express = require('express');
var router = express.Router();
var Q = require('q');

var username = "skjindal93";
var password = "hehe";

router.use(function log(req, res, next){
  next();
});

router.get('/', function(req, res){
	var promises = [];

	var deferredData = Q.defer();
	db.get("data", function(err, body){
		regions = body.regions;
		assets = body.assets;
		deferredData.resolve(true);
	});
	promises.push(deferredData.promise);

	var deferredUser = Q.defer();
	db.get(username, function(err, body){
		checklists = body.checklists;
		deferredUser.resolve(true);
	});

	promises.push(deferredUser.promise);

	Q.all(promises).then(function(d){
		var checklistAssets = [];
		for (var i = 0; i < checklists.length; i++){
			checklistAssets = checklistAssets.concat(checklists[i].assets);
		}

		assets = assets.filter(function (el){
			return checklistAssets.indexOf(el) < 0;
		});

		var data = {
			"regions": regions,
			"assets": assets
		};

		res.render('checklist',{
			title: "Checklist",
			content: data
		});
	});
	
});

router.post('/', function(req, res){
	var data = req.body;
	var promises = [];
	if (typeof data.regions === 'string'){
		data.regions = [data.regions];
	}
	if (typeof data.assets === 'string'){
		data.assets = [data.assets];
	}

	var deferredData = Q.defer();
	db.get("data", function(err, body){
		regions = body.regions;
		assets = body.assets;
		deferredData.resolve(true);
	});
	promises.push(deferredData.promise);

	var deferredUser = Q.defer();
	db.get(username, function(err, body){
		rev = body._rev;
		checklists = body.checklists;
		deferredUser.resolve(true);
	});

	promises.push(deferredUser.promise);

	Q.all(promises).then(function(d){
		checklists.push(data);
		var json = {
			"_rev": rev,
			"password": password,
			"checklists": checklists
		};

		db.insert(json, username, function(err, body, header){
			if (err){
				console.log(err);
			}

			var checklistAssets = [];

			for (var i = 0; i < checklists.length; i++){
				checklistAssets = checklistAssets.concat(checklists[i].assets);
			}

			assets = assets.filter(function (el){
				return checklistAssets.indexOf(el) < 0;
			});

			var data = {
				"regions": regions,
				"assets": assets
			};

			res.render('checklist',{
				title: "Checklist",
				content: data
			});
		});
	});
	
	
	
});

module.exports = router;