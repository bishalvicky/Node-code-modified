var express = require('express'),
    bodyparser = require('body-parser'),
    ibmbluemix = require('ibmbluemix'),
    ibmpush = require('ibmpush');

//configuration for application
var appConfig = {
    applicationId: "f1e442d6-79bb-4e42-baee-3da1d7ac583c",
    applicationRoute: "http://node-code.mybluemix.net",
    applicationSecret: "d59b875fbe53ed4340df9304747bf182d2bba0ea"
};

// create an express app
var app = express();
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
  extended: true
}));

//uncomment below code to protect endpoints created afterwards by MAS
//var mas = require('ibmsecurity')();
//app.use(mas);


//initialize mbaas-config module
ibmbluemix.initialize(appConfig);
//var logger = ibmbluemix.getLogger();
var push=ibmpush.initializeService();;

<<<<<<< HEAD
=======
/*
app.use(function(req, res, next) {
	console.log("Using...");
	req.ibmpush = ibmpush.initializeService(req);
	req.logger = logger;
	next();
});
*/
>>>>>>> 7063d82c4eb3588341d747602c9c5dfc1664e8b5

var push = ibmpush.initializeService();
//initialize ibmconfig module
//var ibmconfig = ibmbluemix.getConfig();

//get context root to deploy your application
//the context root is '${appHostName}/v1/apps/${applicationId}'
<<<<<<< HEAD
//var contextRoot = ibmconfig.getContextRoot();
//appContext=express.Router();
//app.use(contextRoot, appContext);
=======
var contextRoot = ibmconfig.getContextRoot();

appContext=express.Router();
app.use(contextRoot, appContext);
>>>>>>> 7063d82c4eb3588341d747602c9c5dfc1664e8b5

//console.log("contextRoot: " + contextRoot);

// log all requests


var message = { "alert" : "The BlueList has been updated.",
					"url": "http://www.google.com"
};

push.sendBroadcastNotification(message,null).then(function (response) {
	console.log("Notification sent successfully to all devices.", response);
	//res.send("Sent notification to all registered devices.");
}, function(err) {
	console.log("Failed to send notification to all devices.");
	console.log(err);
});

// create resource URIs
// endpoint: https://mobile.ng.bluemix.net/${appHostName}/v1/apps/${applicationId}/notifyOtherDevices/
<<<<<<< HEAD
	//var results = 'Sent notification to all registered devices successfully.';
=======

/*appContext.post('/notifyOtherDevices', function(req,res) {
	var results = 'Sent notification to all registered devices successfully.';
>>>>>>> 7063d82c4eb3588341d747602c9c5dfc1664e8b5

	console.log("Trying to send push notification via JavaScript Push SDK");
	var message = { "alert" : "The BlueList has been updated.",
					"url": "http://www.google.com"
	};

	push.sendBroadcastNotification(message,null).then(function (response) {
		console.log("Notification sent successfully to all devices.");
		res.send("Sent notification to all registered devices.");
	}, function(err) {
		console.log("Failed to send notification to all devices.");
		console.log(err);
		res.send(400, {reason: "An error occurred while sending the Push notification.", error: err});
	});
<<<<<<< HEAD

=======
});
*/
>>>>>>> 7063d82c4eb3588341d747602c9c5dfc1664e8b5

// host static files in public folder
// endpoint:  https://mobile.ng.bluemix.net/${appHostName}/v1/apps/${applicationId}/static/
//appContext.use('/static', express.static('public'));


//app.listen(ibmconfig.getPort());
//console.log('Server started at port: '+ibmconfig.getPort());
