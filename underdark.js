var Player = function(client,name,x,y) {
	this.name = name;
	this.x = x;
	this.y = y;
	this.symbol = '@';
	this.client = client;
	this.desiredMovements = [];
}

exports.Player = Player;

Player.prototype.desireMove = function(x,y) {
	this.desiredMovements.push({x:x,y:y});
}


var Map = function() {
	this.w = 40;
	this.h = 25;
	this.symbols = [];
	this.colors_r = [];
	this.colors_g = [];
	this.colors_b = [];
	for(var i = 0 ; i < this.w*this.h; i++ ) {
		this.symbols[i] = '#';
		this.colors_r[i] = 0;
		this.colors_g[i] = Math.random();
		this.colors_b[i] = 0;
	}
}

exports.Map = Map;

Map.prototype.translate = function(x,y) {
	return y*this.w+x;
}


var Game = function(socket) {
	this.map = new Map();
	this.players = [];
	this.socket = socket;
}

exports.Game = Game;

Game.prototype.getPlayerByClient = function(client) {
	for(var i = 0, len = this.players.length; i < len ; i++ ) {
		var p = this.players[i];
		if( p.client == client ) {
			return p;
		}
	}
	return null;
}

Game.prototype.removePlayerFromGame = function(player) {
	var x,y;
	for(var i=0,len=this.players.length;i<len;i++) {
		if(this.players[i]==player) {
			x = this.players[i].x;
			y = this.players[i].y;
			this.players.splice(i,1);
			break;
		}
	}
	this.sendMapCharacter(this.socket,x,y);	
}

var CMD_SENDCHAR = 0;
var CMD_MSG = 1;


Game.prototype.sendMessage = function(client,msg) {
	client.send(CMD_MSG+'|'+msg);	
}

Game.prototype.sendCharacter = function(client,x,y,symbol,r,g,b) {
  	client.broadcast(CMD_SENDCHAR+'|'+this.map.translate(x,y)+"|"+symbol.charCodeAt(0)+'|'+r+'|'+g+'|'+b);
}

Game.prototype.sendMapCharacter = function(client,x,y) {
	var i = this.map.translate(x,y);
	this.sendCharacter(client,x,y,this.map.symbols[i],this.map.colors_r[i],this.map.colors_g[i],this.map.colors_b[i]);	
}
