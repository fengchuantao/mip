define(function (require) {
    'use strict';

    var fn = require('./fn');
    var dom = require('../dom/dom');

    /**
     * Regular for parsing params.
     * @const
     * @inner
     * @type {RegExp}
     */
    var PARSE_REG = /^(\w+):([\w-]+)\.([\w-]+)(?:\(([^\)]+)\))?$/;

    /**
     * Regular for checking elements.
     * @const
     * @inner
     * @type {RegExp}
     */
    var CHECK_REG = /^mip-/;

    /**
     * Key list of picking options.
     * @const
     * @inner
     * @type {Array}
     */
    var OPTION_KEYS = ['executeEventAction', 'parse', 'checkTarget', 'getTarget', 'attr'];


    /**
     * MIP does not support external JavaScript, so we provide EventAction to trigger events between elements.
     * TODO: refactor
     * @class
     * @param {?Object} opt Options
     */
    function EventAction(opt) {
        opt && fn.extend(this, fn.pick(opt, OPTION_KEYS));
    }

    EventAction.prototype = {
        /**
         * Attribute name to trigger events.
         * @type {string}
         */
        attr: 'on',

        /**
         * Execute the event-action.
         * @param {string} type The event's type
         * @param {HTMLElement} target The source element of native event.
         * @param {Event} nativeEvent The native event.
         */
        execute: function (type, target, nativeEvent) {
            if (!target) {
                return;
            }
            var attr, parent;
            var attrSelector = '[' + this.attr + ']';
            do {
                if (attr = target.getAttribute(this.attr)) {
                    this._execute(this.parse(attr, type, nativeEvent));
                    target = target.parentElement;
                    if (!target) {
                        return;
                    }
                }
                target = dom.closest(target, attrSelector);
            } while (target);
        },
        
        /**
         * Ensure the target element is a MIPElement
         * @param {HTMLElement} target 
         * @return {boolean}
         */
        checkTarget: function (target) {
            return target && target.tagName && CHECK_REG.test(target.tagName.toLowerCase());
        },

        /**
         * Get the target element by ID
         * @param {string} id
         * @return {HTMLElement}
         */
        getTarget: function (id) {
            return document.getElementById(id);
        },

        /**
         * Excute the 'executeEventAction' of a MIPElement.
         * @param {Object} action
         * @param {MIPElement} target
         */
        executeEventAction: function (action, target) {
            target.executeEventAction && target.executeEventAction(action);
        },

        /**
         * Excute the parsed actions.
         * @private
         * @param {Array.<Object>} actions
         */
        _execute: function (actions) {
            for (var i = 0; i < actions.length; i++) {
                var action = actions[i];
                var target = this.getTarget(action.id);
                if (this.checkTarget(target)) {
                    this.executeEventAction(action, target);
                }
            }
        },

        /**
         * Parse the action string.
         * @param {string} actionString
         * @retrun {Array.<Object>}
         */
        parse: function (actionString, type, nativeEvent) {
            if (typeof actionString !== 'string') {
                return [];
            }
            var actions = actionString.trim().split(' ');
            var result = [];
            for (var i = 0; i < actions.length; i++) {
                var matchedResult = actions[i].match(PARSE_REG);
                if (matchedResult && matchedResult[1] === type) {
                    result.push({
                        type: matchedResult[1],
                        id: matchedResult[2],
                        handler: matchedResult[3],
                        arg: matchedResult[4],
                        event: nativeEvent
                    });
                }
            }
            return result;
        }
    };

    return EventAction;
});
