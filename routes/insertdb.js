var express = require('express');
var router = express.Router();

router.use(function log(req, res, next){
  console.log("InsertDB");
  next();
});

router.get('/', function(req, res){
  console.log(req.params);
  res.send("GET request!");
});

router.post('/', function(){
  res.send("Got a POST request!");
});

module.exports = router;
