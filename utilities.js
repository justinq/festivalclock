/*
 * Copyright (c) 2011 Justin Quillinan - http://justinq.net
 * GPL version 3 or later (see http://www.gnu.org/copyleft/gpl.html)
 */

/*
 * This stuff really should have a better home.
 */

/*
 * Get URL vars
 */
$.extend({
    getUrlVars: function() {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?')+1).split('&');
        for (var i=0; i<hashes.length; i++) {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    },
    getUrlVar: function(name) {
        return $.getUrlVars()[name];
    }
});

/*
 * Print message to console
 */
debug = function(log_txt) {
    if (window.console != undefined) {
        console.log(log_txt);
    }
};

/**
 * * Provides requestAnimationFrame in a cross browser way.
 * * @author paulirish / http://paulirish.com/
 * */

if ( !window.requestAnimationFrame ) {
    window.requestAnimationFrame = ( function() {
        return window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {

            window.setTimeout( callback, 1000 / 60 );

        };
    } )();
}

