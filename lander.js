;(function($){
    var View = $.View = function(model, canvas){
	this.model = model;
	this.canvas = canvas;
	this.context = canvas.getContext('2d');
	this.update();
    };
    View.prototype.update = function(){
	var width = this.canvas.width;
	var height = this.canvas.height;
	this.context.clearRect(0, 0, width, height);
	this.context.fillRect(0, 0, width, height);
    };
})(window.lander = window.lander || {});
