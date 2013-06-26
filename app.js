console.log('Server running at http://127.0.0.1:8124/');
var app = require('http').createServer(handler)
  , io = require('socket.io').listen(8129)
    , fs = require('fs')

	app.listen(8124);

	function handler (req, res) {
	  fs.readFile(__dirname + '/client/index.html',
			    function (err, data) {
				    if (err) {
					      res.writeHead(500);
					      return res.end('Error loading index.html');
					    }
				
				    res.writeHead(200);
				    res.end(data);
				  });
	}

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
      console.log(data);
    });
});
