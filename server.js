const ws = require('ws');

const wss = new WebSocketServer({port: 4443});

var clients = new List();



wss.on('connection', function connection(ws)	{
	ws.on('message', function message(data)	{
		console.log('received: %s', data);
	});

	ws-send('something');
});
