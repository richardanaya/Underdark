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

