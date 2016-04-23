;(function(lander){
    console.log('Moon Lander Visualisation');

    var display = document.getElementById('display');

    var model = {
        "lander": {
            "x": 0, "y": 10000,
            "vx": 1, "vy": 0,
            "orientation": Math.PI/4, "angular-velocity": 0.05,
            "radius": 10,
            "fuel": 100,
            "thrusting": false,
            "crashed": false,
            "landed": false
        },
    };

    function copyTraceFrameToModel(frame, lander) {
        lander.x = frame.x;
        // Some scaling on the coordinates so there's more usable space on
        // screen
        lander.y = frame.y * 2;
        lander.orientation = frame.o;
        lander.fuel = frame.fuel * 100;
        lander.thrusting = frame.thrusting;
        lander.crashed = frame.crashed;
        lander.landed = frame.landed;
    }

    var view = new lander.View(model, display);
    view.update();

    var trace = (function() {
        var WAIT_TIME = 100;

        var frame = 0;
        var currentTrace = [];

        function tick(){
            if (frame < currentTrace.length) {
                copyTraceFrameToModel(currentTrace[frame], model.lander);
            }
            if (currentTrace.length + WAIT_TIME < frame) {
                frame = 0;
            }
            view.update();
            frame++;
            requestAnimationFrame(tick);
        };
        tick();

        return {
            play: function(trace) {
                currentTrace = trace;
                frame = 0;
            }
        }
    }());

    //----------------------------------------------------------------------
    //  File integration
    $(function() {
        var selected = null;

        function select(f) {
            $('#file-list').find('a:contains("' + selected + '")').removeClass('active');
            selected = f;
            $('#file-list').find('a:contains("' + selected + '")').addClass('active');
        }

        function play(fname) {
            $.getJSON("/d/" + fname, function(contents) {
                trace.play(contents);
            });
        }

        function refreshFiles() {
            $.getJSON("/d", function(files) {
                console.log("Found ", files.length, " files");
                $('#file-list').empty().append($.map(files, function(f) {
                    return $('<a>', {
                        href: '#',
                        class: 'list-group-item',
                        text: f,
                        click: function() {
                            select(f);
                            play(f);
                            return false;
                        }
                    });
                }));
                select(selected);
            });
        }

        // Start the file list loader
        window.setInterval(refreshFiles, 10000);
        refreshFiles();

        $('#refresh-btn').click(refreshFiles);
    });

})(lander);
