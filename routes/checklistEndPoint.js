var express = require('express');
var router = express.Router();
var Q = require('q');


router.use(function log(req, res, next){
  next();
});

var checklistsUsername;
var checklists;

Array.prototype.getUnique = function() {
    var o = {}, a = [];
    for (var i = 0; i < this.length; i++) 
    	o[this[i]] = 1;
    for (var e in o) 
    	a.push(e);
    return a;
}
function makeAutoComplete(arr,trueArr){
	var ret = [];
	arr.forEach(function(item, i){
		trueArr.forEach(function(it, j){
			if (item === it.value){
				ret.push({
					"label": trueArr[j].label,
					"value": trueArr[j].value
				});
			}
		});
	});
	return ret;
}

function getNames(arr){
	var promises = [];
	var ret = [];
	arr.forEach(function(item, i){
		var deferred = Q.defer();
		db.get(arr[i], function(err, body){
			ret[i] = {};
			ret[i].value = arr[i];
			ret[i].label = body.name;
			deferred.resolve(ret[i]);
		});
		promises.push(deferred.promise);
	});
	return Q.all(promises);
}
function getChecklists(checklistIndex, region, asset){
	
	var deferred = Q.defer();
	db.get(username, function(err, body){
		checklistsUsername = body.checklists;
		var checklistsArr = [];

		if (checklistIndex){
			checklistsArr = [checklistsUsername[checklistIndex]];
			deferred.resolve(checklistsArr);
		}
		
		else if (region){
			checklistsUsername.forEach(function(checklist, index){
				if (checklist.regions.indexOf(region) > -1)
					checklistsArr.push(checklist);
			});
			deferred.resolve(checklistsArr);
		}
		
		else if (asset){
			checklistsUsername.forEach(function(checklist, index){
				if (checklist.assets.indexOf(asset) > -1)
					checklistsArr.push(checklist);
			});
			deferred.resolve(checklistsArr);
		}
		
		else {
			checklistsArr = checklistsUsername;
			deferred.resolve(checklistsArr);
		}
	});

	return deferred.promise;
}

router.get('/', function(req, res){
	
functions.checkBasicAuthentication(req).then(function(data){
		var authData = JSON.parse(data);
		if (authData.status){
			username = authData.username;
			password = authData.password;
			var promises = [];

			var deferredData = Q.defer();

			db.get("data", function(err, body){
				console.log(body.assets);
				trueAssets = body.assets.slice();
				trueRegions = body.regions.slice();
				var promises = [];

				var deferredRegions = Q.defer();
				getNames(trueRegions).then(function(data){
					trueRegions = data;
					deferredRegions.resolve(true);
				});
				promises.push(deferredRegions.promise);
				
				var deferredAssets = Q.defer();
				getNames(trueAssets).then(function(data){
					trueAssets = data;
					deferredAssets.resolve(true);
				});
				promises.push(deferredAssets.promise);
				regions = body.regions;
				assets = body.assets;
				Q.all(promises).then(function(){
					deferredData.resolve(true);
				});
			});
			

			promises.push(deferredData.promise);

			var deferredUser = Q.defer();

			var arg1 = false;
			var arg2 = false;
			var arg3 = false;
				
			if (req.query.checklist)
				arg1 = parseInt(req.query.checklist.split('_')[1]);
			else if (req.query.region)
				arg2 = req.query.region;
			else if (req.query.asset){
				arg3 = req.query.asset;
			}

			getChecklists(arg1, arg2, arg3).then(function(data){
				checklists = data;
				deferredUser.resolve(true);
			});

			promises.push(deferredUser.promise);

			
			Q.all(promises).then(function(d){
				var checklistAssets = [];
				for (var i = 0; i < checklistsUsername.length; i++){
					checklistAssets = checklistAssets.concat(checklistsUsername[i].assets);
				}

				assets = assets.filter(function (el){
					return checklistAssets.indexOf(el) < 0;
				});

				regions = makeAutoComplete(regions,trueRegions);
				assets = makeAutoComplete(assets,trueAssets);

				var data = {
					"regions": regions,
					"assets": assets,
					"trueAssets": trueAssets,
					"trueRegions": trueRegions,
					"checklists": checklists
				};

				res.send(data);
			});
		}
	});
});

router.post('/', function(req, res){
	
	functions.checkBasicAuthentication(req).then(function(data){
		var authData = JSON.parse(data);
		if (authData.status){
			username = authData.username;
			password = authData.password;

			var data = req.body.data;

			var promises = [];

			data.checklists.forEach(function(item, index){
				data.checklists[index] = JSON.parse(item);
				data.checklists[index].regions = data.checklists[index].regions.getUnique();
			});

			data.checklists = data.checklists.filter(function(el){
				return (el.assets.length!==0 && el.regions.length!==0);
			});

			checklists = data.checklists;

			var deferredData = Q.defer();
			db.get("data", function(err, body){
				console.log(body.assets);
				trueAssets = body.assets.slice();
				trueRegions = body.regions.slice();
				var promises = [];

				var deferredRegions = Q.defer();
				getNames(trueRegions).then(function(data){
					trueRegions = data;
					deferredRegions.resolve(true);
				});
				promises.push(deferredRegions.promise);
				
				var deferredAssets = Q.defer();
				getNames(trueAssets).then(function(data){
					trueAssets = data;
					deferredAssets.resolve(true);
				});
				promises.push(deferredAssets.promise);
				regions = body.regions;
				assets = body.assets;
				Q.all(promises).then(function(){
					
					deferredData.resolve(true);
				});	
				
			});

			promises.push(deferredData.promise);

			var deferredUser = Q.defer();
			db.get(username, function(err, body){
				rev = body._rev;
				deferredUser.resolve(true);
			});

			promises.push(deferredUser.promise);

			Q.all(promises).then(function(d){
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

					regions = makeAutoComplete(regions,trueRegions);
					assets = makeAutoComplete(assets,trueAssets);

					var data = {
						"regions": regions,
						"assets": assets,
						"trueAssets": trueAssets,
						"trueRegions": trueRegions,
						"checklists": checklists
					};

					res.send(data);
				});
			});
		}
	});
});

module.exports = router;