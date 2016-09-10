/**
 * File selector widget (that needs our particular endpoint spec)
 *
 * onSelect will be called with a full path when the user selects a file,
 * or null when the user goes back to picking a file.
 */
function FileSelector(el, baseUrl, showError) {
    var path = [];
    var selection = null;
    var onSelect = null;

    var filenameContainer = $('<div>').append(
            $('<span>', { class: 'glyphicon glyphicon-menu-right', css: { marginRight: 5 }})
        ).appendTo(el).hide();
    var filenameEl = $('<a>', { href: '#', click: clearSelection }).appendTo(filenameContainer);
    var breadcrumbContainer = $('<div>').appendTo(el);
    $('<button>', { class: 'btn btn-default glyphicon glyphicon-refresh', css: {
            float: 'right'
            }}).click(function() {
        refreshFiles();
        return false;
    }).appendTo(breadcrumbContainer);
    var breadcrumbEl = $('<ol>', { class: 'breadcrumb' }).appendTo(breadcrumbContainer);

    var listEl = $('<div>', { class: 'list-group left-pane' }).appendTo(el);

    var fileList = ItemList(listEl, fileCaption, selectFile);

    function updateVisibilities() {
        filenameContainer.toggle(selection != null);
        breadcrumbContainer.toggle(selection == null);
        listEl.toggle(selection == null);
    }

    function setSelection(sel) {
        if (sel && sel.length) filenameEl.text(sel[sel.length-1]);
        selection = sel;
        updateVisibilities();
        fireSelection();
    }

    function fireSelection() {
        if (onSelect) onSelect(selection);
    }

    function clearSelection() {
        setSelection(null);
        return false;
    }

    function selectFile(x) {
        if (x[0] == 'dir') {
            path.push(x[1]);
            refreshFiles();
        } else {
            setSelection(path.concat(x[1]));
        }
    }

    function fileCaption(x) {
        var type = x[0];
        var filename = x[1];

        return [filename, '', '', type == 'file' ? 'console'  :
                                  type == 'trace' ? 'record' :
                                  'folder-open'];
    }

    function updateBreadcrumbs() {
        var the_path = path.slice();
        var all_crumbs = ['root'].concat(the_path);
        var clickable_crumbs = all_crumbs.slice(0, all_crumbs.length - 1);

        var els = $.map(clickable_crumbs, function(name, i) {
            return $('<li>').append($('<a>', { href: '#', text: name, click: function() {
                path = the_path.slice(0, i);
                refreshFiles();
            }}));
        });

        breadcrumbEl.empty().append(els).append($('<li>', {
            class: 'active',
            text: all_crumbs[all_crumbs.length-1]
        }));
    }

    function refreshFiles() {
        updateBreadcrumbs();

        $.getJSON(baseUrl + '/' + path.join('/')).then(function(response) {
            try {
                fileList.update(response);
            } catch (e) {
                showError(e);
            }
        }).fail(function(jqxhr, textStatus, error) {
            showError(textStatus + ', ' + error);
        });
    }

    refreshFiles();

    return {
        select: function(fn) {
            onSelect = fn;
            fireSelection();
            return this;
        },
        getSelection: function() {
            return selection;
        }
    };
}
