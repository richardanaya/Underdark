//
var nun = require('nun');
var nerve = require("./lib/nerve/nerve");
 var io = require('socket.io');
 
var render = function(res,template,data) {
  if( data == undefined ) {
    data = {};
  }
  nun.render(__dirname+"/templates/"+template, data, {}, function(err, output){
    if (err) throw err;
    var buffer = '';
    output.on('data', function(data){ buffer += data; })
          .on('end', function(){ res.respond(buffer); });
  });
}

var get = nerve.get;
var app = [
];

var server = nerve.create(app, {session_duration: 10000, document_root: './static'})
server.listen(8779);


var w = 40;
var h = 25;
var colors_c = [];
var colors_r = [];
var colors_g = [];
var colors_b = [];
for(var i = 0 ; i < w*h; i++ ) {
	colors_c[i] = '#'.charCodeAt(0);
	colors_r[i] = 0;
	colors_g[i] = Math.random();
	colors_b[i] = 0;
}

var playerX = 0;
var playerY = 0;
var playerSymbol = '@'.charCodeAt(0);

var socket = io.listen(server); 
socket.on('connection', function(client){
  for(var i = 0 ; i < w*h; i++ ) {
	client.send(i+"|"+colors_c[i]+'|'+colors_r[i]+"|"+colors_g[i]+"|"+colors_b[i]);
  }
  client.send((playerY*w+playerX)+"|"+playerSymbol+'|1|1|1');
 
  client.on('message', function(data){ 
	var cmd = data.split('|');
	var cmd_type = parseFloat(cmd[0]);
	var oldX = playerX;
	var oldY = playerY;
	if( cmd_type == 0 ) //move left 
	{
		playerX--;
	}
	else if( cmd_type == 1 ) //move up 
	{
		playerY--;
	}
	else if( cmd_type == 2 ) //move right 
	{
		playerX++;
	}
	else if( cmd_type == 3 ) //move down 
	{
		playerY++;
	}

	var i = oldY*w+oldX;
  	client.broadcast((playerY*w+playerX)+"|"+playerSymbol+'|1|1|1');
	client.broadcast(i+"|"+colors_c[i]+'|'+colors_r[i]+"|"+colors_g[i]+"|"+colors_b[i]);
  	client.send((playerY*w+playerX)+"|"+playerSymbol+'|1|1|1');
	client.send(i+"|"+colors_c[i]+'|'+colors_r[i]+"|"+colors_g[i]+"|"+colors_b[i]);
  });
}); 

