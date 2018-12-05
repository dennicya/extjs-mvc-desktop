/**
 * @class common.desktop.TaskBar
 * @extends Ext.toolbar.Toolbar
 */
Ext.define('common.desktop.TopBar', {
    extend: 'Ext.toolbar.Toolbar',

    alias: 'widget.cm-topbar',
    region: 'north',
    padding: '3px 12px 3px 0',

    initComponent: function () {

        this.createItems();
        this.callParent();

    },
    createItems: function () {

        var modules = new Array();

        modules.push({
            xtype: 'tbspacer',
            width: 10
        }, {
            xtype: 'image',
            itemId: 'support-logo',
            src: 'resources/images/logo.png',
            alt: 'My Logo',
            autoEl: {
                tag: 'a',
                href: '/'
            }
        }, '->');

        modules.push({
            xtype: 'tbtext',
            itemId: 'toolbar-user',
            cls: 'toolbar-info',
            text: '',
            width: 150
        }, '-', {
            text: '',
            iconCls: 'settings',
            itemId: 'profile-menu',
            width: 200,
            tooltip: {
                title: 'Active Account',
                text: 'This is my account'
            },
            iconCls: 'organization',
            menu: {
                width: 200,
                items: ['-', {
                    text: 'Logout',
                    iconCls: 'logout',
                    action: 'logout'
                }, '-', {
                    text: 'Help',
                    iconCls: 'help',
                    action: 'help'
                }]
            }
        });

        this.items = modules;

    }
});
