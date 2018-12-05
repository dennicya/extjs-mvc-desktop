/**
 * @class common.desktop.Desktop
 * @extends Ext.panel.Panel
 * <p>This class manages the wallpaper, shortcuts and taskbar.</p>
 */
Ext.define('common.desktop.Desktop', {
    extend: 'Ext.panel.Panel',

    alias: 'widget.cm-desktop',

    uses: [
        'Ext.util.MixedCollection',
        'Ext.menu.Menu',
        'Ext.view.View',
        'Ext.window.Window',

        'common.desktop.TaskBar',
        'common.desktop.Wallpaper',
        'common.desktop.TopBar',
        'common.desktop.ShortcutModel'
    ],

    activeWindowCls: 'ux-desktop-active-win',
    inactiveWindowCls: 'ux-desktop-inactive-win',
    lastActiveWindow: null,

    border: false,
    html: '&#160;',
    layout: 'fit',

    xTickSize: 1,
    yTickSize: 1,

    app: null,

    /**
     * @cfg {Array/Ext.data.Store} shortcuts
     * The items to add to the DataView. This can be a {@link Ext.data.Store Store} or a
     * simple array. Items should minimally provide the fields in the
     * {@link common.desktop.ShortcutModel Shortcut}.
     */
    shortcuts: null,

    /**
     * @cfg {String} shortcutItemSelector
     * This property is passed to the DataView for the desktop to select shortcut items.
     * If the {@link #shortcutTpl} is modified, this will probably need to be modified as
     * well.
     */
    shortcutItemSelector: 'div.ux-desktop-shortcut',

    /**
     * @cfg {String} shortcutTpl
     * This XTemplate is used to render items in the DataView. If this is changed, the
     * {@link #shortcutItemSelector} will probably also need to changed.
     */
    shortcutTpl: [
        '<tpl for=".">',
        '<div class="ux-desktop-shortcut" id="{code}-shortcut">',
        '<div class="ux-desktop-shortcut-icon {code}-shortcut">',
        '<img src="', Ext.BLANK_IMAGE_URL, '" title="{name}">',
        '</div>',
        '<span class="ux-desktop-shortcut-text">{code:this.getShortcutText}</span>',
        '</div>',
        '</tpl>',
        '<div class="x-clear"> </div>', {
            getShortcutText: function (value) {

                var text;
                if (value != null) {

                    try {
                        text = darubini.locale.modules[value].shortcutText;
                    } catch (e) {
                        text = darubini.locale.text.MISSING_VALUE_FOR + ' ' + value;
                    }
                }

                return text;
            }
        }],

    /**
     * @cfg {Object} taskbarConfig
     * The config object for the TaskBar.
     */
    taskbarConfig: null,

    windowMenu: null,

    initComponent: function () {
        var me = this;

        me.windowMenu = new Ext.menu.Menu(me.createWindowMenu());

        me.tbar = me.topbar = new common.desktop.TopBar();
        me.bbar = me.taskbar = new common.desktop.TaskBar(me.taskbarConfig);
        me.taskbar.windowMenu = me.windowMenu;

        me.windows = new Ext.util.MixedCollection();

        me.contextMenu = new Ext.menu.Menu(me.createDesktopMenu());

        me.items = [{
            xtype: 'cm-wallpaper',
            id: me.id + '_wallpaper'
        }, me.createDataView()];

        me.callParent();

        me.shortcutsView = me.items.getAt(1);

        var wallpaper = me.wallpaper;
        me.wallpaper = me.items.getAt(0);
        if (wallpaper) {
            me.setWallpaper(wallpaper, me.wallpaperStretch);
        }

        Ext.Ajax.on({
            beforerequest: function () {
                Ext.getCmp('ajax_connect').addCls('ajax_connect');
            },
            requestcomplete: function () {
                Ext.getCmp('ajax_connect').removeCls('ajax_connect');
            }
        });

        Ext.on('resize', function () {
            me.fireEvent('desktopResized');
            me.resizeDesktop();
            Ext.getCmp('id_shortcut_dataview').on('resize', me.resizeDesktop, me);
        });
    },

    afterRender: function () {
        var me = this;
        me.callParent();
        me.el.on('contextmenu', me.onDesktopMenu, me);
    },

    /**
     * Update Icons location when the window is resized
     */
    resizeDesktop: function () {

        var dv = Ext.getCmp('id_shortcut_dataview');
        var dv_w = dv.getWidth();
        var dv_h = dv.getHeight();
        var t = 0;
        var l = 0;
        var t_add = 0;
        Ext.getCmp('id_shortcut_dataview').getStore().each(function (r) {
            var id = r.data.code;
            if (id != undefined) {
                id = id + '-shortcut';
                Ext.get(id).setTop(t);
                Ext.get(id).setLeft(l);
                t_add = Ext.get(id).getHeight();
                t = t + 200;
                if (t + t_add > dv_h) {
                    l = l + 190;
                    t = 0;
                }
            }
        }, this);

    },
    //------------------------------------------------------
    // Overrideable configuration creation methods

    createDataView: function () {
        var me = this;
        return {
            xtype: 'dataview',
            id: 'id_shortcut_dataview',
            overItemCls: 'x-view-over',
            trackOver: true,
            itemSelector: me.shortcutItemSelector,
            store: Ext.create('Ext.data.Store', {
                model: 'common.desktop.ShortcutModel',
                data: {
                    items: [
                        {name: 'Jean Luc', email: 'jeanluc.picard@enterprise.com', phone: '555-111-1111'},
                        {name: 'Worf', email: 'worf.moghsson@enterprise.com', phone: '555-222-2222'},
                        {name: 'Deanna', email: 'deanna.troi@enterprise.com', phone: '555-333-3333'},
                        {name: 'Data', email: 'mr.data@enterprise.com', phone: '555-444-4444'}
                    ]
                },
                proxy: {
                    type: 'memory',
                    reader: {
                        type: 'json',
                        rootProperty: 'items'
                    }
                }
            }),
            style: {
                position: 'absolute'
            },
            x: 0,
            y: 0,
            tpl: new Ext.XTemplate(me.shortcutTpl)
        };
    },

    createDesktopMenu: function () {
        var me = this, ret = {
            items: me.contextMenuItems || []
        };

        if (ret.items.length) {
            ret.items.push('-');
        }

        ret.items.push(
            {text: 'Tile', handler: me.tileWindows, scope: me, minWindows: 1},
            {text: 'Cascade', handler: me.cascadeWindows, scope: me, minWindows: 1}
        );

        return ret;
    },

    createWindowMenu: function () {
        var me = this;
        return {
            defaultAlign: 'br-tr',
            items: [
                {text: 'Restore', handler: me.onWindowMenuRestore, scope: me},
                {text: 'Minimize', handler: me.onWindowMenuMinimize, scope: me},
                {text: 'Maximize', handler: me.onWindowMenuMaximize, scope: me},
                '-',
                {text: 'Close', handler: me.onWindowMenuClose, scope: me}
            ],
            listeners: {
                beforeshow: me.onWindowMenuBeforeShow,
                hide: me.onWindowMenuHide,
                scope: me
            }
        };
    },

    //------------------------------------------------------
    // Event handler methods

    onDesktopMenu: function (e) {
        var me = this, menu = me.contextMenu;
        e.stopEvent();
        if (!menu.rendered) {
            menu.on('beforeshow', me.onDesktopMenuBeforeShow, me);
        }
        menu.showAt(e.getXY());
        menu.doConstrain();
    },

    onDesktopMenuBeforeShow: function (menu) {
        var me = this, count = me.windows.getCount();

        menu.items.each(function (item) {
            var min = item.minWindows || 0;
            item.setDisabled(count < min);
        });
    },

    onWindowClose: function (win) {
        var me = this;
        me.windows.remove(win);
        me.taskbar.removeTaskButton(win.taskButton);
        me.updateActiveWindow();
    },

    //------------------------------------------------------
    // Window context menu handlers

    onWindowMenuBeforeShow: function (menu) {
        var items = menu.items.items, win = menu.theWin;
        items[0].setDisabled(win.maximized !== true && win.hidden !== true); // Restore
        items[1].setDisabled(win.minimized === true); // Minimize
        items[2].setDisabled(win.maximized === true || win.hidden === true); // Maximize
    },

    onWindowMenuClose: function () {
        var me = this, win = me.windowMenu.theWin;

        win.close();
    },

    onWindowMenuHide: function (menu) {
        Ext.defer(function () {
            menu.theWin = null;
        }, 1);
    },

    onWindowMenuMaximize: function () {
        var me = this, win = me.windowMenu.theWin;

        win.maximize();
        win.toFront();
    },

    onWindowMenuMinimize: function () {
        var me = this, win = me.windowMenu.theWin;

        win.minimize();
    },

    onWindowMenuRestore: function () {
        var me = this, win = me.windowMenu.theWin;

        me.restoreWindow(win);
    },

    //------------------------------------------------------
    // Dynamic (re)configuration methods

    getWallpaper: function () {
        return this.wallpaper.wallpaper;
    },

    setTickSize: function (xTickSize, yTickSize) {
        var me = this,
            xt = me.xTickSize = xTickSize,
            yt = me.yTickSize = (arguments.length > 1) ? yTickSize : xt;

        me.windows.each(function (win) {
            var dd = win.dd, resizer = win.resizer;
            dd.xTickSize = xt;
            dd.yTickSize = yt;
            resizer.widthIncrement = xt;
            resizer.heightIncrement = yt;
        });
    },

    setWallpaper: function (wallpaper, stretch) {
        this.wallpaper.setWallpaper(wallpaper, stretch);
        return this;
    },

    //------------------------------------------------------
    // Window management methods

    cascadeWindows: function () {
        var x = 0, y = 0,
            zmgr = this.getDesktopZIndexManager();

        zmgr.eachBottomUp(function (win) {
            if (win.isWindow && win.isVisible() && !win.maximized) {
                win.setPosition(x, y);
                x += 20;
                y += 20;
            }
        });
    },

    createWindow: function (config, cls) {
        var me = this, win, cfg = Ext.applyIf(config || {}, {
            stateful: false,
            isWindow: true,
            constrainHeader: true,
            minimizable: true,
            maximizable: true
        });

        cls = cls || Ext.window.Window;
        win = me.add(new cls(cfg));

        me.windows.add(win);

        win.taskButton = me.taskbar.addTaskButton(win);
        win.animateTarget = win.taskButton.el;

        win.on({
            activate: me.updateActiveWindow,
            beforeshow: me.updateActiveWindow,
            deactivate: me.updateActiveWindow,
            minimize: me.minimizeWindow,
            destroy: me.onWindowClose,
            scope: me
        });

        win.on({
            boxready: function () {
                win.dd.xTickSize = me.xTickSize;
                win.dd.yTickSize = me.yTickSize;

                if (win.resizer) {
                    win.resizer.widthIncrement = me.xTickSize;
                    win.resizer.heightIncrement = me.yTickSize;
                }
            },
            single: true
        });

        // replace normal window close w/fadeOut animation:
        win.doClose = function () {
            win.doClose = Ext.emptyFn; // dblclick can call again...
            win.el.disableShadow();
            win.el.fadeOut({
                listeners: {
                    afteranimate: function () {
                        win.destroy();
                    }
                }
            });
        };

        return win;
    },

    getActiveWindow: function () {
        var win = null,
            zmgr = this.getDesktopZIndexManager();

        if (zmgr) {
            // We cannot rely on activate/deactive because that fires against non-Window
            // components in the stack.

            zmgr.eachTopDown(function (comp) {
                if (comp.isWindow && !comp.hidden) {
                    win = comp;
                    return false;
                }
                return true;
            });
        }

        return win;
    },

    getDesktopZIndexManager: function () {
        var windows = this.windows;
        // TODO - there has to be a better way to get this...
        return (windows.getCount() && windows.getAt(0).zIndexManager) || null;
    },

    getWindow: function (id) {
        return this.windows.get(id);
    },

    minimizeWindow: function (win) {
        win.minimized = true;
        win.hide();
    },

    restoreWindow: function (win) {
        if (win.isVisible()) {
            win.restore();
            win.toFront();
        } else {
            win.show();
        }
        return win;
    },

    tileWindows: function () {
        var me = this, availWidth = me.body.getWidth(true);
        var x = me.xTickSize, y = me.yTickSize, nextY = y;

        me.windows.each(function (win) {
            if (win.isVisible() && !win.maximized) {
                var w = win.el.getWidth();

                // Wrap to next row if we are not at the line start and this Window will
                // go off the end
                if (x > me.xTickSize && x + w > availWidth) {
                    x = me.xTickSize;
                    y = nextY;
                }

                win.setPosition(x, y);
                x += w + me.xTickSize;
                nextY = Math.max(nextY, y + win.el.getHeight() + me.yTickSize);
            }
        });
    },

    updateActiveWindow: function () {
        var me = this, activeWindow = me.getActiveWindow(), last = me.lastActiveWindow;
        if (last && last.destroyed) {
            me.lastActiveWindow = null;
            return;
        }
        if (activeWindow === last) {
            return;
        }

        if (last) {
            if (last.el.dom) {
                last.addCls(me.inactiveWindowCls);
                last.removeCls(me.activeWindowCls);
            }
            last.active = false;
        }

        me.lastActiveWindow = activeWindow;

        if (activeWindow) {
            activeWindow.addCls(me.activeWindowCls);
            activeWindow.removeCls(me.inactiveWindowCls);
            activeWindow.minimized = false;
            activeWindow.active = true;
        }

        me.taskbar.setActiveButton(activeWindow && activeWindow.taskButton);
    },

    getWinWidth: function () {
        var width = this.getWidth();
        return width < 200 ? 200 : width;
    },

    getWinHeight: function () {
        var height = this.getHeight() - (this.taskbar.getHeight() + this.topbar.getHeight());
        return height < 100 ? 100 : height;
    },

    setSupportMode: function (support, logo, org) {
        this.topbar.setSupportMode(support, logo, org);
    },

    setUserName: function (text) {
        this.topbar.setUserName(text);
    },

    setCurrentPartner: function (text) {
        this.topbar.setCurrentPartner(text);
    }
});
