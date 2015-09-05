;(function($){
    var View = $.View = function(model, canvas){
	this.model = model;
	this.canvas = canvas;
	this.context = canvas.getContext('2d');
	this.context.translate(0, this.canvas.height);
	this.context.scale(1, -1);
	this.update();
    };
    View.prototype.update = function(){
	this.clearDisplay();
	this.showHorizon();
    };
    View.prototype.clearDisplay = function(){
	var width = this.canvas.width;
	var height = this.canvas.height;
	this.context.clearRect(0, 0, width, height);
	this.context.fillRect(0, 0, width, height);
    };
    View.prototype.showHorizon = function(){
	this.context.save();
	this.context.strokeStyle = 'white';
	this.context.beginPath();
	this.context.moveTo(0, this.model.horizon[0]);
	this.model.horizon.forEach(function(height, index){
	    this.context.lineTo(index, height);
	}.bind(this));
	this.context.stroke();
	this.context.restore();
    };
})(window.lander = window.lander || {});
