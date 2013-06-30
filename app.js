// My SocketStream 0.3 app

var http = require('http'),
    ss = require('socketstream');

// Define a single-page client called 'main'
ss.client.define('main', {
  view: 'app.html',
  css:  ['libs/reset.css', 'app.styl'],
  code: ['libs/jquery.min.js', 'app'],
  tmpl: '*'
});

// Serve this client on the root URL
ss.http.route('/', function(req, res){
  res.serveClient('main');
});


// Define a single-page client called 'main'
ss.client.define('game', {
  view: 'game.html',
  css:  ['libs/reset.css', 'app.styl'],
  code: ['libs/jquery.min.js','libs/jquery.lightbox_me.js', 'app', 'libs/jquery.hammer.min.js','libs/howler.min.js','app'],
  tmpl: '*'
});

// Serve this client on the root URL
ss.http.route('/game', function(req, res){
  res.serveClient('game');
});

// Code Formatters
ss.client.formatters.add(require('ss-stylus'));

// Use server-side compiled Hogan (Mustache) templates. Others engines available
ss.client.templateEngine.use(require('ss-hogan'));

// Minimize and pack assets if you type: SS_ENV=production node app.js
if (ss.env === 'production') ss.client.packAssets();

// Start web server
var server = http.Server(ss.http.middleware);
server.listen(80);

// Start SocketStream
ss.start(server);
