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
        }
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
        var timer = 0;

        function tick(){
            if (frame < currentTrace.length) {
                copyTraceFrameToModel(currentTrace[frame], model.lander);
            }
            if (currentTrace.length + WAIT_TIME < frame) {
                frame = 0;
            }
            view.update();
            frame++;
            timer = requestAnimationFrame(tick);
        };

        return {
            play: function(trace) {
                currentTrace = trace;
                frame = 0;
                if (!timer) timer = requestAnimationFrame(tick);
            },
            stop: function() {
                cancelAnimationFrame(timer);
                timer = 0;
            }
        };
    }());

    //----------------------------------------------------------------------
    //  File integration
    /*
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
    */

    // Live running
    (function() {
        var activeProgram;
        var nextLine = 0;
        var timer;
        var traces = [];

        // trace = {
        //    generation: int
        //    program: program_node
        //    score_card: {
        //          _field0: [ [ name, score ]],
        //          _field1: int total score,
        //          _field2: { states: [ { state } ] }
        //    }
        // }
        // program_node = { "variant", "fields" }

        function selectTrace(t) {
            trace.play(t.score_card._field2.states);
            renderScoreTable($('#score-table'), t.score_card._field0);
            $('#program-pane').html(htmlifyProgram(t.program));
        };

        var traceList = ItemList($('#generation-list'), function(t) {
            return ['Gen ' + t.generation, t.score_card._field1.toFixed(0)];
        }, selectTrace);

        $('#start-btn').click(function() {
            stopLoadTraces();
            $.getJSON('/d/start', function(response) {
                if (response.id) {
                    activeProgram = response.id;
                    nextLine = 0;
                    traces = [];
                    scheduleLoadTraces();
                } else
                    alert('Whoopsie, error starting program');
            });
        });

        $('#stop-btn').click(function() {
            stopLoadTraces();
            trace.stop();
            $.getJSON('/d/stop', function(response) {
            });
        });

        function loadTraces() {
            $.getJSON('/d/' + activeProgram + '/' + nextLine, function(response) {
                nextLine = response.next_line;
                if (response.lines) {
                    var ls = response.lines;
                    for (var i = 0; i < ls.length; i++) {
                        traces.push(JSON.parse(ls[i]));
                    };
                    traceList.update(traces);
                }
            });
            scheduleLoadTraces();
        }

        function scheduleLoadTraces() {
            timer = setTimeout(loadTraces, 1000);
        }

        function stopLoadTraces() {
            clearTimeout(timer);
        }
    }());

    function renderScoreTable(el, rows) {
        rows.sort(function(a, b) { return b[1] - a[1]; });
        el.empty().append($.map(rows, function(x) {
            return $('<tr>').append(
                $('<td>', { text: x[0] }),
                $('<td>', { text: humanNum(x[1]) }));
        }));
    }

    /**
     * Selectable item list
     */
    function ItemList(el, caption_fn, select_fn) {
        var _items;
        var _selected;

        function select(i, item_el) {
            el.find('.active').removeClass('active');
            _selected = i;
            item_el.addClass('active');

            select_fn(_items[_selected]);
        }

        return {
            update: function(items) {
                _items = items;

                el.empty().append($.map(_items, function(x, i) {
                    var caption = caption_fn(x);

                    var item = $('<a>', {
                        href: '#',
                        class: 'list-group-item ' + (i == _selected ? 'active': ''),
                    }).append(
                        $('<span>', { text: caption[0] }),
                        $('<span>', { text: caption[1], css: { float: 'right', textAlign: 'right', fontSize: '8pt' }}));

                    item.click(function() {
                        select(i, item);
                        return false;
                    });

                    return item;
                }));
            }
        };
    }
})(lander);
