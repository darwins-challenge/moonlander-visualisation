function humanNum(x) {
    return typeof(x) == 'number' ? x.toFixed(3) : x;
}

var htmlifyProgram = (function() {

    function mkBinOp(op) {
        return function(node) {
            return '( ' + render(node.fields[0]) + ' <span style="font-weight: bold;">' + op + '</span> ' + render(node.fields[1]) + ' )';
        };
    }

    function mkUnOp(op) {
        return function(node) {
            return '( <span style="font-weight: bold;">' + op + '</span> ' + render(node.fields[0]) + ' )';
        };
    }

    function mkConst() {
        return function(node) {
            return '<span style="color: red; font-weight: bold;">' + humanNum(node.fields[0]) + '</span>';
        };
    }

    function mkLit(lit) {
        return function(node) {
            return '<span style="color: red; font-weight: bold;">' + lit + '</span>';
        };
    }

    function renderUnknown(node) {
        if (node == "True") return mkLit("true")(node);
        if (node == "False") return mkLit("false")(node);
        return JSON.stringify(node);
    }

    function renderIf(node) {
        return ('<div style="display: inline-block; vertical-align: text-top; white-space: nowrap;">' +
            'if ' + render(node.fields[0]) + '<br>' +
            '<span style="display: inline-block; width: 4em; text-align: right;">then</span> ' + render(node.fields[1]) + '<br>' +
            '<span style="display: inline-block; width: 4em; text-align: right;">else</span> ' + render(node.fields[2]) +
            '</div>');
    }

    var dispatch = {
        Constant: mkConst(),
        Sensor: mkConst(),
        Command: mkConst(),
        If: renderIf,

        Less: mkBinOp('&lt;'),
        Greater: mkBinOp('&gt;'),
        LessEqual: mkBinOp('&le;'),
        GreaterEqual: mkBinOp('&ge;'),
        Minus: mkBinOp('-'),
        Divide: mkBinOp('/'),
        Plus: mkBinOp('+'),
        Multiply: mkBinOp('&middot;'),
        Equal: mkBinOp('='),

        And: mkBinOp('&and;'),
        Or: mkBinOp('&or;'),
        Not: mkUnOp('&not;'),

        True: mkLit('true'),
        False: mkLit('false'),
    };

    function render(program) {
        return (dispatch[program.variant] || renderUnknown)(program);
    }
    return render;
}());
