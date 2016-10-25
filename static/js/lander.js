;(function($){
    var LANDER_IMAGE_SCALE = 0.3;

    var View = $.View = function(model, canvas){
        this.model = model;
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.context.translate(0, this.canvas.height);
        this.context.scale(1, -1);
        this.update();
    };
    View.prototype.direct = function(x, y, o) {
        this.model.lander.x = x;
        this.model.lander.y = y;
        this.model.lander.orientation = o || 0;
        this.update();
    }
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
        var src_w = 217;
        var src_h = 280;
        var scale = LANDER_IMAGE_SCALE; // Scale of lander in image
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
