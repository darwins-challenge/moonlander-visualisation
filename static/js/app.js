;(function(lander){

    var display = document.getElementById('display');

    var model = {
        "lander": {
            "x": 0, "y": 10000,
            "vx": 1, "vy": 0,
            "orientation": Math.PI/4,
            "angular-velocity": 0.05,
            "radius": 10,
            "fuel": 100,
            "thrusting": false,
            "hit_ground": false,
            "crash_speed": 0.0,
            "landed": false
        }
    };

    function showError(e) {
        var el = $('#errors');
        el.show().text(el.text() + '\n' + e);
    }

    function copyTraceFrameToModel(frame, lander) {
        lander.x = frame.x;
        // Some scaling on the coordinates so there's more usable space on
        // screen
        lander.y = frame.y;
        lander.orientation = frame.o;
        lander.fuel = frame.fuel * 100;
        lander.thrusting = frame.thrusting;
        lander.hit_ground = frame.hit_ground;
        lander.crash_speed = frame.crash_speed;
        lander.landed = frame.landed;
    }

    var view = new lander.View(model, display);
    window.theView = view; // For manual tests
    view.update();

    function animateViaAnimationFrame() {
        return {
            schedule: function(c) { return requestAnimationFrame(c); },
            cancel: function(t) { cancelAnimationFrame(t); },
            frames: function(s) { return s * 60 }
        }
    }

    function animateViaTimer(fps) {
        var period = 1000 / fps;
        return {
            schedule: function(callback) {
                return setTimeout(callback, period);
            },
            cancel: function(t) { clearTimeout(t); },
            frames: function(s) { return s * fps }
        }
    }

    var trace = (function() {
        var WAIT_TIME_S = 2;

        var frame = 0;
        var currentTrace = [];
        var timer = 0;
        var animator = animateViaTimer(45);

        var copyBtn = $('#generation-copy-btn').click(function() {
            var as_text = $.map(traceList.getItems(), function(t) {
                return JSON.stringify(t);
            }).join('\n');
            $('#pasted-trace').val(as_text);
            $('#src-tabs a[href="#paste"]').tab('show')
        }).hide();

        function tick(){
            if (frame < currentTrace.length) {
                copyTraceFrameToModel(currentTrace[frame], model.lander);
            }
            if (currentTrace.length + animator.frames(WAIT_TIME_S) < frame) {
                frame = 0;
            }
            view.update();
            frame++;
            timer = animator.schedule(tick);
        };

        function selectTrace(t) {
            trace.play(statesFromTrace(t));
            renderScoreTable($('#score-table'), t.fitness.score_card._field0);
            $('#program-pane').html(htmlifyProgram(programFromTrace(t)));
        };

        function programFromTrace(t) {
            var program = t.program;
            if (program._field0) return t.program._field0;
            return program;
        }
        function statesFromTrace(t) { return t.fitness.trace; }
        function generationFromTrace(t) { return t.generation; }
        function totalScoreFromTrace(t) { return t.fitness.score_card._field1; }

        var traceList = ItemList($('#generation-list'), function(t) {
            // Determine captions for generations
            var frames = statesFromTrace(t);
            return [
                'Gen ' + generationFromTrace(t),
                totalScoreFromTrace(t).toFixed(0),
                frames[frames.length-1].landed ? 'successful': 'unsuccessful'
                ];
        }, selectTrace);

        return {
            play: function(trace) {
                currentTrace = trace;
                frame = 0;
                if (!timer) timer = animator.schedule(tick);
            },
            stop: function() {
                animator.cancel(timer);
                timer = 0;
            },
            setTraces: function(traces) {
                traceList.update(traces);
                copyBtn.toggle(traces != null && traces.length > 0);
            },
            loadFromText: function(contents) {
                var lines = contents.split('\n');
                var traces = [];
                for (var i = 0; i < lines.length; i++) {
                    try {
                        traces.push(JSON.parse(lines[i]));
                    } catch (e) {
                        if (e instanceof SyntaxError)
                            continue;
                        throw e;
                    }
                };
                traceList.update(traces);
                copyBtn.toggle(traces != null && traces.length > 0);
            }
        };

    }());

    //----------------------------------------------------------------------
    //  Load traces from disk
    $(function() {
        var runFs = FileSelector($('#load-file-selector'), '/api/load/list', showError).select(function(f) {
            $('#load-buttons').toggle(f != null);
        });

        $('#load-btn').click(function() {
            load(runFs.getSelection().join('/'));
        });

        function load(filename) {
            $.get("/api/load/get/" + filename, function(contents) {
                trace.loadFromText(contents);
            });
        }
    });

    //----------------------------------------------------------------------
    //  Load traces from pasteboard
    $(function() {
        $('#load-paste-btn').click(function() {
            trace.loadFromText($('#pasted-trace').val());
        });
    });

    //----------------------------------------------------------------------
    //  Load trace from live running program
    (function() {
        var activeProgram;
        var nextLine = 0;
        var timer;
        var traces = [];

        var runFs = FileSelector($('#run-file-selector'), '/api/run/list', showError).select(function(f) {
            $('#run-buttons').toggle(f != null);
        });

        $('#start-btn').click(function() {
            stopLoadTraces();
            $.getJSON('/api/run/start/' + runFs.getSelection().join('/'), function(response) {
                if (response.id) {
                    activeProgram = response.id;
                    nextLine = 0;
                    traces = [];
                    scheduleLoadTraces();
                } else
                    showError('Whoopsie, error starting program');
            });
        });

        $('.stop-btn').click(function() {
            stopLoadTraces();
            trace.stop();
            $.getJSON('/api/run/stop', function(response) {
            });
        });

        /**
         * Periodically try to load new traces from the live program
         */
        function loadTraces() {
            $.getJSON('/api/run/get/' + activeProgram + '/' + nextLine).then(function(response) {
                try {
                    nextLine = response.next_line;
                    if (response.lines) {
                        var ls = response.lines;
                        for (var i = 0; i < ls.length; i++) {
                            traces.push(JSON.parse(ls[i]));
                        };
                        trace.setTraces(traces);
                    }
                } catch (e) {
                    showError(e);
                }
            }).fail(function(jqxhr, textStatus, error) {
                showError(textStatus + ', ' + error);
            });
            scheduleLoadTraces();
        }

        function scheduleLoadTraces() { timer = setTimeout(loadTraces, 1000); }
        function stopLoadTraces() { clearTimeout(timer); }
    }());

    function renderScoreTable(el, rows) {
        rows.sort(function(a, b) { return b[1] - a[1]; });
        el.empty().append($.map(rows, function(x) {
            return $('<tr>').append(
                $('<td>', { text: x[0] }),
                $('<td>', { text: humanNum(x[1]) }));
        }));
    }

})(lander);
