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

var CMD_SENDCHAR = 0;
var CMD_MSG = 1;

var server = nerve.create(app, {session_duration: 10000, document_root: './static'})
server.listen(8868);

var game = new underdark.Game();

var socket = io.listen(server);

socket.on('connection', function(client){

  client.on('disconnect', function(){
	console.log('client disconnected');
	console.log(client.toString()); 
  	for(var i = 0, len = game.players.length; i < len ; i++ ) {
    		var p = game.players[i];
		if( p.client == client ) {
			//redrawing the map where the character died
			game.sendMapCharacter(socket,p.x,p.y);
			game.players.splice(i,1);
			break;
		}
  	}
  });
 
  client.on('message', function(data){ 
	var p = game.getPlayerByClient(client);

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
		game.sendMessage(client,'You tried to pickup something.');
	}
	else if( cmd_type == 5 ) //login 
	{
		playerName = cmd[1];
		game.players.push(new underdark.Player(client,playerName,0,0));
  		for(var i = 0 ; i < game.map.w*game.map.h; i++ ) {
			client.send(CMD_SENDCHAR+'|'+i+"|"+game.map.symbols[i].charCodeAt(0)+'|'+game.map.colors_r[i]+"|"+game.map.colors_g[i]+"|"+game.map.colors_b[i]);
  		}
  		for(var i = 0, len = game.players.length; i < len ; i++ ) {
    			var p = game.players[i];
			game.sendCharacter(socket,p.x,p.y,p.symbol,1,1,1);	
  		}
		game.sendMessage(client,'Welcome '+playerName);
	}
  });
}); 

var FPS = 12.5;

gameLoop = function() {
	for(var j = 0, plen = game.players.length; j<plen; j++) {
		var p = game.players[j];
		//Process actions since last frame
		var lastPlayerX = p.x;
		var lastPlayerY = p.y;
	
		for(var i = 0,len=p.desiredMovements.length;i<len;i++) {
			p.x += p.desiredMovements[i].x;
			p.y += p.desiredMovements[i].y;
			if( p.x == 20 && p.y == 20 ) {
				if( p.client != null ) {
					game.sendMessage(p.client,'You stepped on a <font color="red">fire</font>');
				}
			}
		}

		if( p.x < 0 ) {
			p.x = 0;	
		}
		else if( p.x >= game.map.w ) {
			p.x = w-1;	
		}
		if( p.y < 0 ) {
			p.y = 0;	
		}
		else if( p.y >= game.map.h ) {
			p.y = h-1;	
		}

		p.desiredMovements = [];

		if( lastPlayerX != p.x || lastPlayerY != p.y ) {
			game.sendMapCharacter(socket,lastPlayerX,lastPlayerY);
			game.sendCharacter(socket,p.x,p.y,p.symbol,1,1,1);	
		}	
	}
	game.sendCharacter(socket,20,20,'^',Math.random(),0,0);	
	setTimeout(gameLoop,1000/FPS);
}


setTimeout(gameLoop,1000/FPS);
