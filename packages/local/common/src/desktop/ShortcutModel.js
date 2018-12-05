/*!
 * Ext JS Library
 * Copyright(c) 2006-2014 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

/**
 * @class common.desktop.ShortcutModel
 * @extends Ext.data.Model
 * This model defines the minimal set of fields for desktop shortcuts.
 */
Ext.define('common.desktop.ShortcutModel', {
    extend: 'Ext.data.Model',
    fields: [{
        name: 'id'
    }, {
        name: 'name'
    }, {
        name: 'code'
    }, {
        name: 'clazzName'
    }]
})

