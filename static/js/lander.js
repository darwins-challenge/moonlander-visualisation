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

        // Apply some transformations that nicely center the lander on the
        // screen.
        this.context.save();
        this.context.translate(this.canvas.width / 2, 50);
        this.showHorizon();
        this.showLander();
        this.context.restore();

        this.showFuel();
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
        this.context.moveTo(-this.canvas.width / 2, 0);
        this.context.lineTo(this.canvas.width / 2, 0);
        this.context.stroke();
        this.context.restore();
    };
    View.prototype.showLander = function() {
        var lander = this.model.lander;
        var overshoot = Math.PI/3;
        // Draw it 3 times so that if the landers goes out the sides, it looks
        // like it wraps.
        [-1, 0, 1].map(function(multiplier){
            return multiplier * this.canvas.width;
        }.bind(this)).forEach(function(offset){
            this.context.save();
            var trans_y = lander.y + lander.radius; // Make the lander's bottom appear at 0
            this.context.translate(offset + lander.x, trans_y);
            this.context.rotate(lander.orientation);

            if (lander.thrusting) {
                this.context.fillStyle = 'yellow';

                var t = new Date().getTime();
                var r = (t / 2) % 2 ? 1.8 : 2.1;

                this.context.beginPath();
                this.context.moveTo(0, -r * lander.radius);
                this.context.lineTo(0 + 0.8 * lander.radius, 0.3 * lander.radius);
                this.context.lineTo(0 - 0.8 * lander.radius, 0.3 * lander.radius);
                this.context.closePath();
                this.context.fill();
            }

            this.context.strokeStyle = 'white';
            this.context.fillStyle = 'black';
            if (lander.landed) { this.context.fillStyle = 'green'; }
            if (lander.crashed) { this.context.fillStyle = 'red'; }

            // Nose cone
            this.context.beginPath();
            this.context.moveTo(0 - lander.radius, lander.radius * 0.3);
            this.context.lineTo(0, lander.radius * 2);
            this.context.lineTo(0 + lander.radius, lander.radius * 0.3);
            this.context.closePath();
            this.context.fill();
            this.context.stroke();

            // Circle body
            this.context.beginPath();
            this.context.arc(
                0, 0, lander.radius,
                0 - overshoot,
                Math.PI + overshoot
            );
            this.context.closePath();
            this.context.fill();
            this.context.stroke();

            this.context.restore();
        }.bind(this));
    };
    View.prototype.showFuel = function() {
        var lander = this.model.lander;
        var fuel = lander.fuel || 0;

        var right = this.canvas.width - 10;
        var top = this.canvas.height - 5;

        this.context.save();
        this.context.fillStyle = '#c791db';
        this.context.fillRect(right - fuel * 2, top - 20, fuel * 2, 15);
        this.context.restore();

    };
})(window.lander = window.lander || {});
