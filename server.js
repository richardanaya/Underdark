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
server.listen(8868);


var w = 40;
var h = 25;
var symbols = [];
var colors_r = [];
var colors_g = [];
var colors_b = [];
for(var i = 0 ; i < w*h; i++ ) {
	symbols[i] = '#';
	colors_r[i] = 0;
	colors_g[i] = Math.random();
	colors_b[i] = 0;
}

var playerX = 0;
var playerY = 0;
var playerName = "";
var playerSymbol = '@';

var CMD_SENDCHAR = 0;
var CMD_MSG = 1;


sendMessage = function(client,msg) {
	client.send(CMD_MSG+'|'+msg);	
}

sendCharacter = function(client,x,y,symbol,r,g,b) {
  	client.broadcast(CMD_SENDCHAR+'|'+(y*w+x)+"|"+symbol.charCodeAt(0)+'|'+r+'|'+g+'|'+b);
}

sendMapCharacter = function(client,x,y) {
	var i = x*w+y;
	sendCharacter(socket,x,y,symbols[i],colors_r[i],colors_g[i],colors_b[i]);	
}

var socket = io.listen(server);

var clientCount = 0;
 
socket.on('connection', function(client){
  for(var i = 0 ; i < w*h; i++ ) {
	client.send(CMD_SENDCHAR+'|'+i+"|"+symbols[i]+'|'+colors_r[i]+"|"+colors_g[i]+"|"+colors_b[i]);
  }
  client.send(CMD_SENDCHAR+'|'+(playerY*w+playerX)+"|"+playerSymbol+'|1|1|1');
 
  client.on('message', function(data){ 
	var cmd = data.split('|');
	var cmd_type = parseFloat(cmd[0]);
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
	else if( cmd_type == 4 ) //pickup an item 
	{
		sendMessage(client,'You tried to pickup something.');
	}
	else if( cmd_type == 5 ) //login 
	{
		playerName = cmd[1];	
		sendMessage(client,'Welcome '+playerName);
	}
  });
}); 

var FPS = 12.5;

gameLoop = function() {
	//var i = oldY*w+oldX;
	//sendMapCharacter(socket,oldX,oldY);	
	sendCharacter(socket,20,20,'^',Math.random(),0,0);	
	sendCharacter(socket,playerX,playerY,playerSymbol,1,1,1);	
	setTimeout(gameLoop,1000/FPS);
}


setTimeout(gameLoop,1000/FPS);
