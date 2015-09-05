;(function(lander){
    console.log('Moon Lander Visualisation');

    var display = document.getElementById('display');
    var horizon = new Array(display.width);
    for (var index = 0; index < display.width; index++){
	horizon[index] = 0;
    }


    var model = {
	"lander": {
	    "x": 37, "y": 51,
	    "vx": 0, "vy": 0,
	    "orientation": 0, "angular-velocity": 0,
	    "fuel": 1
	},
	"horizon": horizon
    };

    new lander.View(model, display);
})(lander);
