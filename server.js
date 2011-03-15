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
var app = [];

var server = nerve.create(app, {session_duration: 10000, document_root: './static'})
server.listen(8868);

var socket = io.listen(server);
var game = new underdark.Game(socket);

socket.on('connection', function(client){
  client.on('disconnect', function(){
	var p = game.getPlayerByClient(client);
	game.removePlayerFromGame(p);
  });
 
  client.on('message', function(data){ 
	var p = game.getPlayerByClient(client);

	var cmd = data.split('|');
	var cmd_type = parseFloat(cmd[0]);
	if( (cmd_type == 0) && (p != null) ) {  //left
		p.desireMove(-1,0);
	}
	else if( (cmd_type == 1) && (p != null) ) { //up
		p.desireMove(0,-1);
	}
	else if( (cmd_type == 2) && (p != null) ) {  //right
		p.desireMove(1,0);
	}
	else if( (cmd_type == 3) && (p != null) ) { //down
		p.desireMove(0,1);
	}
	else if( cmd_type == 4 ) //pickup an item 
	{
		game.sendMessage(client,'You tried to pickup something.');
	}
	else if( cmd_type == 5 ) //login 
	{
		playerName = cmd[1];
		game.loginPlayer(client,playerName);
	}
  });
}); 


var FPS = 12.5;

loop = function() {
	game.gameLoop();
	setTimeout(loop,1000/FPS);
}
setTimeout(loop,1000/FPS);
