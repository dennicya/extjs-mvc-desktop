/**
 * Initialize the desktop using a viewport
 */
Ext.define('MvcDesktop.view.Viewport', {
    extend: 'Ext.container.Viewport',

    mixins: {
        observable: 'Ext.util.Observable'
    },

    requires: [
        'common.desktop.Desktop'
    ],

    isReady: false,
    modules: null,
    useQuickTips: true,

    constructor: function (config) {

        var me = this;

        me.mixins.observable.constructor.call(this, config);

        if (Ext.isReady) {
            Ext.Function.defer(me.init, 10, me);
        } else {
            Ext.onReady(me.init, me);
        }

        me.on('ready', function () {
            setTimeout(function () {
                Ext.get("loading-container").fadeOut({
                    remove: true
                })
            }, 250);
        });
    },

    init: function () {
        var me = this,
            desktopCfg;

        if (me.useQuickTips) {
            Ext.QuickTips.init();
        }

        me.modules = me.getModules();
        if (me.modules) {
            me.initModules(me.modules);
        }

        desktopCfg = me.getDesktopConfig();
        me.desktop = new common.desktop.Desktop(desktopCfg);

        me.viewport = new Ext.container.Viewport({
            layout: 'fit',
            items: [me.desktop]
        });

        Ext.getWin().on('beforeunload', me.onUnload, me);

        me.isReady = true;
        me.fireEvent('ready', me);
    },

    /**
     * This method returns the configuration object for the Desktop object. A derived
     * class can override this method, call the base version to build the config and
     * then modify the returned object before returning it.
     */
    getDesktopConfig: function () {
        var me = this,
            cfg = {
                app: me,
                taskbarConfig: me.getTaskbarConfig()
            };

        Ext.apply(cfg, {
            wallpaper: 'wallpaper.jpg',
            wallpaperStretch: true
        });
        return cfg;
    },
    getModules: Ext.emptyFn,

    /**
     * This method returns the configuration object for the TaskBar. A derived class
     * can override this method, call the base version to build the config and then
     * modify the returned object before returning it.
     */
    getTaskbarConfig: function () {
        var me = this,
            cfg = {
                app: me
            };

        Ext.apply(cfg, {
            trayItems: [{
                xtype: 'cm-trayclock',
                flex: 1
            }, {
                xtype: 'container',
                id: 'ajax_connect',
                width: 20,
                height: 16
            }]
        });
        return cfg;
    },
    onReady: function (fn, scope) {
        if (this.isReady) {
            fn.call(scope, this);
        } else {
            this.on({
                ready: fn,
                scope: scope,
                single: true
            });
        }
    },
    getDesktop: function () {
        return this.desktop;
    },
    onUnload: function (e) {
        if (this.fireEvent('beforeunload', this) === false) {
            e.stopEvent();
        }
    }
});
