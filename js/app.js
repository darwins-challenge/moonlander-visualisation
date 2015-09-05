;(function(lander){
    console.log('Moon Lander Visualisation');

    var display = document.getElementById('display');
    var horizon = new Array(display.width);
    horizon[0] = 50;
    for (var index = 1; index < display.width; index++){
        horizon[index] = horizon[index - 1] + 2 * (Math.random() - 0.5);
    }

    var model = {
        "lander": {
            "x": 37, "y": 251,
            "vx": 1, "vy": 0,
            "orientation": Math.PI/4, "angular-velocity": 0.05,
            "radius": 10,
            "fuel": 100,
            "thrusting": true,
            "crashed": false,
            "landed": false
        },
        "horizon": horizon
    };

    var view = new lander.View(model, display);
    function tick(){
        model.lander.x += model.lander.vx;
        if (model.lander.x > display.width) {
            model.lander.x -= display.width;
        }
        view.update();
        requestAnimationFrame(tick);
    };
    tick();
})(lander);
