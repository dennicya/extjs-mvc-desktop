/**
 * Controller that hold the shared functionality
 */

Ext.define('MvcDesktop.controller.BaseController', {
    extend: 'Ext.app.Controller',

    refs: [{
        ref: 'desktop',
        selector: 'cm-desktop'
    }, {
        ref: 'moduleView',
        selector: 'cm-desktop > dataview'
    }, {
        ref: 'topbar',
        selector: 'cm-desktop topbar'
    }],

    init: function () {

        this.control({
            'cm-desktop > dataview': {
                itemclick: this.loadModule
            },
            'cm-desktop cm-topbar menuitem[action=help]': {
                click: this.help
            },
            'cm-desktop cm-topbar menuitem[action=logout]': {
                click: this.logout
            }
        });
    },

    loadModule: function (view, record) {

        this.getController(record.get('clazzName')).createWindow(record);
    },

    logout: function () {
        Ext.MessageBox.show({
            title: 'Logging out',
            msg: Ext.util.Format.htmlEncode('Wait infinitely......'),
            buttons: Ext.MessageBox.OK,
            icon: Ext.MessageBox.INFO
        });
    },
    help: function () {

        Ext.MessageBox.show({
            title: 'Implement This !!!!!!',
            msg: Ext.util.Format.htmlEncode('Coming Eventually.......'),
            buttons: Ext.MessageBox.OK,
            icon: Ext.MessageBox.INFO
        });
    }
});
