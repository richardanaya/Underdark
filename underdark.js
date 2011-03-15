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
