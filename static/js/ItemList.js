/**
 * Selectable item list
 *
 * caption_fn should return [caption, right_label, item_class, glyph]
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
        getItems: function() {
            return _items;
        },
        update: function(items) {
            _items = items;

            el.empty().append($.map(_items, function(x, i) {
                var caption = caption_fn(x);
                var glyph = caption[3];

                var item = $('<a>', {
                    href: '#'
                }).append(
                    $('<span>', { class: 'glyphicon ' + (glyph ? 'glyphicon-' + glyph : '') }),
                    $('<span>', { text: caption[0] }),
                    $('<span>', { text: caption[1], css: { float: 'right', textAlign: 'right', fontSize: '8pt' }}));

                item.addClass('list-group-item');
                item.addClass(caption[2]);
                if (i == _selected) { item.addClass('active'); }

                item.click(function() {
                    select(i, item);
                    return false;
                });

                return item;
            }));
        }
    };
}
