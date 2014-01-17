/*
 * Copyright (c) 2011 Justin Quillinan - http://justinq.net
 * GPL version 3 or later (see http://www.gnu.org/copyleft/gpl.html)
 */

/*
 * Document based js for index.html document
 */

var StateEnum = {
    LOADING : 0,
    NORMAL  : 1,
    HELP    : 2,
    ABOUT   : 3,
}
var state = StateEnum.LOADING;
var timer, clock, itemInfo;

function hover(loc, cls) {
    if (loc.className)
        loc.className = cls;
}

function fadeAll() {
    $("#clockHelp").fadeOut("slow");
    $("#clockAbout").fadeOut("slow");
    $("#itemInfo").fadeOut("slow");
    state = StateEnum.NORMAL;
}

function togglePlay() {
    fadeAll();
    timer.togglePlay();
    document.getElementById('btnPlayPause').value =
        timer.getRunning() ? '| |' : '>';
}

function rewind()       { fadeAll(); timer.decreaseSpeed(); }
function fastforward()  { fadeAll(); timer.increaseSpeed(); }
function jumpToStart()  { fadeAll(); timer.jumpToStart(); }
function jumpToEnd()    { fadeAll(); timer.jumpToEnd(); }
function showSettings() {
    alert('TODO: settings');
}
function showHelp() {
    $("#itemInfo").fadeOut("slow");
    switch(state) {
        case StateEnum.ABOUT:
            $("#clockAbout").fadeOut("slow");
        case StateEnum.NORMAL:
            $("#clockHelp").fadeIn("slow");
            state = StateEnum.HELP;
            break;
        case StateEnum.HELP:
            $("#clockHelp").fadeOut("slow");
            state = StateEnum.NORMAL;
            break;
        case StateEnum.LOADING:
        default:
            break;
    }
}
function showAbout() {
    $("#itemInfo").fadeOut("slow");
    switch(state) {
        case StateEnum.HELP:
            $("#clockHelp").fadeOut("slow");
        case StateEnum.NORMAL:
            $("#clockAbout").fadeIn("slow");
            state = StateEnum.ABOUT;
            break;
        case StateEnum.ABOUT:
            $("#clockAbout").fadeOut("slow");
            state = StateEnum.NORMAL;
            break;
        case StateEnum.LOADING:
        default:
            break;
    }
}

function startTimerControls(timer) {
    document.getElementById('clockTime').appendChild( document.createTextNode("") );
    document.getElementById('clockDate').appendChild( document.createTextNode("") );

    // Update the time display
    function updateTimer() {
        document.getElementById('clockTime').firstChild.nodeValue = timer.getTimeStr();
        document.getElementById('clockDate').firstChild.nodeValue = timer.getDateStr();
        requestAnimationFrame(updateTimer, null);
    }
    requestAnimationFrame(updateTimer, null);
}

/*
 * Loading ticker
 */
var loadingTime = 0;
function loadingTick() {
    loadingTime = (loadingTime+1)%4;
    var text = '';
    for (var i=0; i<loadingTime; i++)
        text += '.';
    document.getElementById('loadingTick').innerHTML = text;
    if (state == StateEnum.LOADING)
        setTimeout(loadingTick,1000);
}

/*
 * Mouse/touch events
 */

// Get the coordinates for a mouse or touch event
function getCoords(e) {
    if (e.offsetX) {
        // Works in Chrome / Safari (except on iPad/iPhone)
        return { x: e.offsetX, y: e.offsetY };
    }
    else if (e.layerX) {
        // Works in Firefox
        return { x: e.layerX, y: e.layerY };
    }
    else {
        // Works in Safari on iPad/iPhone
        return { x: e.pageX - cb_canvas.offsetLeft, y: e.pageY - cb_canvas.offsetTop };
    }
}

moveEventFunction = function(e) {
    if (state != StateEnum.NORMAL)
        return;

    var p = getCoords(e.touches ? e.touches[0] : e);
    var i = clock.objectAtPoint(p);
    if (i!==null) {
        var colour = 'rgb('+i.r+','+i.g+','+i.b+')';
        $('#itemInfo').html(
            '<h1 style="color:'+colour+'">'+i.node+'</h1>'+
            '<h2>'+i.category+'</h2>'+
            '<h3 style="color:'+colour+'">'+i.genre+'</h3>'
        );
        $('#itemInfo').css({
            left: p.x + 12,
            top:  p.y + 12,
            'border-color': colour,
        });
        $("#itemInfo").fadeIn("fast");
    }
    else {
        $("#itemInfo").fadeOut("slow");
    }
    
    return false; // Stop event bubbling up
}

/*
 * Initialisation function
 */
$(document).ready(function() {
    if (!document.getElementById('clockCanvas').getContext) {
        $("#clockLoading").fadeOut("fast");
        $("#clockError").fadeIn("slow");
        return;
    }
    setTimeout(loadingTick,1000);
    // load the default data
    $.get('min_price.json', {},
        function(data) {
            timer = new Timer($.getUrlVar('date'), data.start_date, data.end_date);
            startTimerControls(timer);
            var i = $.getUrlVar('id'); // TODO: selected id
            // Get canvas HTML element
            var canvas = document.getElementById('clockCanvas');
            clock = new Clock(canvas, timer, data.festivals, data.shows, data.palette);
            state = StateEnum.NORMAL;
            $("#clockLoading").fadeOut("slow");
            $("#clockCanvas").fadeIn("slow");
            $("#clockTime").fadeIn("slow");
            $("#clockDate").fadeIn("slow");
            $("#clockPlayControls").fadeIn("slow");
            $("#clockHelpControls").fadeIn("slow");

            // Set up event handlers
            itemInfo = document.getElementById('itemInfo');
            canvas.onmousemove = moveEventFunction;
            canvas.ontouchmove = moveEventFunction;
            canvas.onclick = fadeAll;
            canvas.ontouch = fadeAll;

        }, 'json');
});
