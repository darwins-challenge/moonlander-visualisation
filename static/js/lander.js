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
        //this.showHorizon();
        this.showLander();
        this.context.restore();

        this.showFuel();
    };
    View.prototype.clearDisplay = function(){
        var width = this.canvas.width;
        var height = this.canvas.height;
        this.context.clearRect(0, 0, width, height);
        //this.context.fillRect(0, 0, width, height);
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

    function drawLander(offset, lander, context) {
        var overshoot = Math.PI/3;
        var trans_y = lander.y + lander.radius; // Make the lander's bottom appear at 0
        context.translate(offset + lander.x, trans_y);
        context.rotate(lander.orientation);

        if (lander.thrusting) {
            context.fillStyle = 'yellow';

            var t = new Date().getTime();
            var r = (t / 2) % 2 ? 1.8 : 2.1;

            context.beginPath();
            context.moveTo(0, -r * lander.radius);
            context.lineTo(0 + 0.8 * lander.radius, 0.3 * lander.radius);
            context.lineTo(0 - 0.8 * lander.radius, 0.3 * lander.radius);
            context.closePath();
            context.fill();
        }

        context.strokeStyle = 'white';
        context.fillStyle = 'black';
        if (lander.landed) { context.fillStyle = 'green'; }
        if (lander.crashed) { context.fillStyle = 'red'; }

        // Nose cone
        context.beginPath();
        context.moveTo(0 - lander.radius, lander.radius * 0.3);
        context.lineTo(0, lander.radius * 2);
        context.lineTo(0 + lander.radius, lander.radius * 0.3);
        context.closePath();
        context.fill();
        context.stroke();

        // Circle body
        context.beginPath();
        context.arc(
            0, 0, lander.radius,
            0 - overshoot,
            Math.PI + overshoot
        );
        context.closePath();
        context.fill();
        context.stroke();
    }

    function drawLander(offset, lander, context) {
        var src_w = 217;
        var src_h = 280;
        var scale = 0.3;
        var baseline_h = 245;

        var dst_w = scale * src_w;
        var dst_h = scale * src_h;

        var imageId = 'lander0';
        if (lander.thrusting) {
            var t = new Date().getTime();
            if ((t/2) % 2 == 0) {
                imageId = 'lander1';
            } else {
                imageId = 'lander2';
            }
        }
        if (lander.landed) { imageId = 'landerg'; }
        if (lander.hit_ground && lander.crash_speed) { imageId = 'landerr'; }

        var image = document.getElementById(imageId);

        context.translate(offset + lander.x, lander.y);
        context.rotate(lander.orientation);
        context.drawImage(image, -dst_w / 2,  - (src_h - baseline_h) * scale, dst_w, dst_h);
    }

    function drawDropshadow(offset, lander, context) {
        var shadow_w = 40;

        var radius = Math.max((1-(lander.y/500)) * shadow_w, 3);
        var alpha = 0.4 - Math.min((lander.y/300) * 0.2, 0.2);

        context.translate(offset + lander.x, Math.min(0, lander.y));
        context.scale(1, 0.15);

        context.beginPath();
        context.arc(0, 0, radius, 0, 2 * Math.PI);
        context.closePath();

        context.fillStyle = 'rgba(0, 0, 0, ' + alpha + ')';
        context.fill();
    }

    View.prototype.showLander = function() {
        var lander = this.model.lander;
        var w = this.canvas.width;

        var k = Math.floor((lander.x - w / 2) / w);
        lander.x -= k * w;

        // Draw it 3 times so that if the landers goes out the sides, it looks
        // like it wraps.
        [-1, 0, 1].map(function(multiplier){
            return multiplier * w;
        }.bind(this)).forEach(function(offset){
            this.context.save();
            drawDropshadow(offset, lander, this.context);
            this.context.restore();

            this.context.save();
            drawLander(offset, lander, this.context);
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
