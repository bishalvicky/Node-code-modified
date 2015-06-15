var forever = require('forever-monitor');

var child = new (forever.Monitor)('app.js', {
  max: 999999,
  silent: true,
  args: [],
  'logFile': 'logs/app.log', // Path to log output from forever process (when daemonized)
  'outFile': 'logs/app.log', // Path to log output from child stdout
  'errFile': 'logs/app.log', // Path to log output from child stderr
});
child.on('watch:restart', function(info) {
  console.error('Restaring script because ' + info.file + ' changed');
});

child.on('restart', function() {
  console.error('Forever restarting script for ' + child.times + ' time');
});
child.on('exit', function () {
  console.log('app.js has exited after 3 restarts');
});

child.start();
