var nun = require('nun');
var nerve = require("./lib/nerve/nerve");
var io = require('socket.io');
var underdark = require('./underdark');
 
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

var players = [];

getPlayerByClient = function(client) {
	for(var i = 0, len = players.length; i < len ; i++ ) {
		var p = players[i];
		if( p.client == client ) {
			return p;
		}
	}
	return null;
}


var CMD_SENDCHAR = 0;
var CMD_MSG = 1;


sendMessage = function(client,msg) {
	client.send(CMD_MSG+'|'+msg);	
}

sendCharacter = function(client,x,y,symbol,r,g,b) {
  	client.broadcast(CMD_SENDCHAR+'|'+(y*w+x)+"|"+symbol.charCodeAt(0)+'|'+r+'|'+g+'|'+b);
}

sendMapCharacter = function(client,x,y) {
	var i = y*w+x;
	sendCharacter(socket,x,y,symbols[i],colors_r[i],colors_g[i],colors_b[i]);	
}

var socket = io.listen(server);

socket.on('connection', function(client){
  for(var i = 0 ; i < w*h; i++ ) {
	client.send(CMD_SENDCHAR+'|'+i+"|"+symbols[i].charCodeAt(0)+'|'+colors_r[i]+"|"+colors_g[i]+"|"+colors_b[i]);
  }
  for(var i = 0, len = players.length; i < len ; i++ ) {
    var p = players[i];
    client.send(CMD_SENDCHAR+'|'+(p.y*w+p.x)+"|"+p.symbol.charCodeAt(0)+'|1|1|1');
  }

  client.on('disconnect', function(data){ 
  	for(var i = 0, len = players.length; i < len ; i++ ) {
    		var p = players[i];
		if( p.client == client ) {
			players.splice(i,1);
		}
  	}
  });
 
  client.on('message', function(data){ 
	var p = getPlayerByClient(client);

	var cmd = data.split('|');
	var cmd_type = parseFloat(cmd[0]);
	if( cmd_type == 0 ) //move left 
	{
		if( p != null ) {
			p.desireMove(-1,0);
		}
	}
	else if( cmd_type == 1 ) //move up 
	{
		if( p != null ) {
			p.desireMove(0,-1);
		}
	}
	else if( cmd_type == 2 ) //move right 
	{
		if( p != null ) {
			p.desireMove(1,0);
		}
	}
	else if( cmd_type == 3 ) //move down 
	{
		if( p != null ) {
			p.desireMove(0,1);
		}
	}
	else if( cmd_type == 4 ) //pickup an item 
	{
		sendMessage(client,'You tried to pickup something.');
	}
	else if( cmd_type == 5 ) //login 
	{
		playerName = cmd[1];
		players.push(new underdark.Player(client,playerName,0,0));
		sendMessage(client,'Welcome '+playerName);
	}
  });
}); 

var FPS = 12.5;

gameLoop = function() {
	for(var j = 0, plen = players.length; j<plen; j++) {
		var p = players[j];
		//Process actions since last frame
		var lastPlayerX = p.x;
		var lastPlayerY = p.y;
	
		for(var i = 0,len=p.desiredMovements.length;i<len;i++) {
			p.x += p.desiredMovements[i].x;
			p.y += p.desiredMovements[i].y;
			if( p.x == 20 && p.y == 20 ) {
				if( p.client != null ) {
					sendMessage(p.client,'You stepped on a <font color="red">fire</font>');
				}
			}
		}

		if( p.x < 0 ) {
			p.x = 0;	
		}
		else if( p.x >= w ) {
			p.x = w-1;	
		}
		if( p.y < 0 ) {
			p.y = 0;	
		}
		else if( p.y >= h ) {
			p.y = h-1;	
		}

		p.desiredMovements = [];
	
		sendMapCharacter(socket,lastPlayerX,lastPlayerY);
		sendCharacter(socket,p.x,p.y,p.symbol,1,1,1);	
	}
	sendCharacter(socket,20,20,'^',Math.random(),0,0);	
	setTimeout(gameLoop,1000/FPS);
}


setTimeout(gameLoop,1000/FPS);
