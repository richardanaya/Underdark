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
	this.objects = [];
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

Map.prototype.getObjectAt = function(x,y) {
	for( var i = 0, len = this.objects.length; i<len; i++ ) {
		var o = this.objects[i];
		if(o.x == x && o.y == y) {
			return o;
		}
	}
	return null;
}

var Game = function(socket) {
	this.map = new Map();
	this.players = [];
	this.socket = socket;
	this.map.objects.push(new Fire(this,20,20));
	this.map.objects.push(new Wall(this,20,19));
	this.map.objects.push(new Wall(this,21,19));
	this.map.objects.push(new Wall(this,19,19));
	this.map.objects.push(new Wall(this,19,20));
	this.map.objects.push(new Wall(this,19,21));
	this.map.objects.push(new Wall(this,20,21));
	this.map.objects.push(new Wall(this,21,21));
	this.map.objects.push(new Door(this,21,20));
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

Game.prototype.loginPlayer = function(client,playerName) {
	this.players.push(new Player(client,playerName,0,0));
	var m = this.map;
	for(var i = 0 ; i < m.w*m.h; i++ ) {
		client.send(CMD_SENDCHAR+'|'+i+"|"+m.symbols[i].charCodeAt(0)+'|'+m.colors_r[i]+"|"+m.colors_g[i]+"|"+m.colors_b[i]);
  	}
  	for(var i = 0, len = this.players.length; i < len ; i++ ) {
    		var p = this.players[i];
		this.sendCharacter(this.socket,p.x,p.y,p.symbol,1,1,1);	
  	}
	this.sendMessage(client,'Welcome '+playerName);
}

Game.prototype.gameLoop = function() {
	for(var j = 0, plen = this.players.length; j<plen; j++) {
		var p = this.players[j];
		//Process actions since last frame
		var lastPlayerX = p.x;
		var lastPlayerY = p.y;
	
		for(var i = 0,len=p.desiredMovements.length;i<len;i++) {
			var nextX = p.x + p.desiredMovements[i].x;
			var nextY = p.y + p.desiredMovements[i].y;
			var o = this.map.getObjectAt(nextX,nextY);

			if( (o == null) || (o.canEnter(p)) ) {
				p.x = nextX;
				p.y = nextY;
				if( o != null ) { o.onEnter(p); }
			}
			else {
				o.onCollide(p);
				break;
			}
		}

		if( p.x < 0 ) {
			p.x = 0;	
		}
		else if( p.x >= this.map.w ) {
			p.x = this.map.w-1;	
		}
		if( p.y < 0 ) {
			p.y = 0;	
		}
		else if( p.y >= this.map.h ) {
			p.y = this.map.h-1;	
		}

		p.desiredMovements = [];

		if( lastPlayerX != p.x || lastPlayerY != p.y ) {
			this.sendMapCharacter(this.socket,lastPlayerX,lastPlayerY);
		}	
	}

	for(var i = 0; i < this.map.objects.length ; i++ ) {
		var  o = this.map.objects[i];
		this.sendCharacter(this.socket,o.x,o.y,o.symbol,o.r,o.g,o.b);	
	}
	for(var j = 0, plen = this.players.length; j<plen; j++) {
		var p = this.players[j];
		this.sendCharacter(this.socket,p.x,p.y,p.symbol,1,1,1);	
	}
}

Wall = function(g,x,y) {
	this.game = g;
	this.symbol = 'O';
	this.r = .7;
	this.g = .7;
	this.b = .7;
	this.x = x;
	this.y = y;
}

exports.Wall = Wall;

Wall.prototype.canEnter = function(p) {
	return false;
}

Wall.prototype.onCollide = function(p) {
	this.game.sendMessage(p.client,"You bump into a wall");	
}

Fire = function(g,x,y) {
	this.game = g;
	this.symbol = '^'
	this.r = 1;
	this.g = 0;
	this.b = 0;
	this.x = x;
	this.y = y;
}

exports.Fire = Fire;

Fire.prototype.canEnter = function(p) {
	return true;
}

Fire.prototype.onEnter = function(p) {
	this.game.sendMessage(p.client,'You stepped on a <font color="red">fire</font>');	
}

Door = function(g,x,y) {
	this.game = g;
	this.symbol = '|';
	this.r = .7;
	this.g = .2;
	this.b = .1;
	this.x = x;
	this.y = y;
	this.isOpen = false;
}

exports.Door = Door;

Door.prototype.canEnter = function(p) {
	return this.isOpen;
}

Door.prototype.onCollide = function(p) {
	this.isOpen = true;
	this.symbol = '/';
	this.game.sendMessage(p.client,"You open a door");	
}

Door.prototype.onEnter = function(p) {

}
