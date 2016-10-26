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

    function renderUnknownVariant(node) {
        return '<span style="font-weight: bold;">' + node.variant + '</span> (' +
            $.map(node.fields, render).join(', ') + ')';
    }

    function renderUnknown(node) {
        if (typeof node === 'string') return mkLit(node)(node);
        if (node.variant)
            return renderUnknownVariant(node);
        return JSON.stringify(node);
    }

    function renderIf(node) {
        return ('<div style="display: inline-block; vertical-align: text-top; white-space: nowrap;">' +
            'if ' + render(node.fields[0]) + '<br>' +
            '<span style="display: inline-block; width: 4em; text-align: right;">then</span> ' + render(node.fields[1]) + '<br>' +
            '<span style="display: inline-block; width: 4em; text-align: right;">else</span> ' + render(node.fields[2]) +
            '</div>');
    }

    function renderList(list) {
        ret = ["<table class=\"table table-condensed\">"];
        $.each(list, function(i, item) {
            ret.push("<tr valign=\"top\"><td>" + render(item[0]) + "</td>");
            ret.push("<td>&rArr;</td><td>" + render(item[1]) + "</td></tr>");
        });
        ret.push("</table>");
        return ret.join('\n');
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
        if (program === undefined)
            return "WUT UNDEFINED";
        if ($.isArray(program))
            return renderList(program);
        return (dispatch[program.variant] || renderUnknown)(program);
    }
    return render;
}());
