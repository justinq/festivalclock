/*
 * Copyright (c) 2011 Justin Quillinan - http://justinq.net
 * GPL version 3 or later (see http://www.gnu.org/copyleft/gpl.html)
 */

var PIx2 = Math.PI*2;
var DEGREE2RADIAN = PIx2/360.0;

// start animation on a canvas
function Clock(canvas, timer, nodes, items, palette) {
    var _me = this;
    this._timer         = timer;
    this._fadetime      = 60*60*24*1000; // 1 day
    this._nodes         = nodes;
    this._items         = items;
    this._palette       = palette;
    this._canvas        = canvas;
    this._redrawClock   = false;
    this._drawTime      = 100; // arbitrary estimate for drawing the clock
    this._ctx           = this._canvas.getContext ? this._canvas.getContext('2d') : null;
    this._lastIntervalTime = new Date( this._timer.getTime() );
    this._timerIntervalID = this._ctx!==null ? requestAnimationFrame(update, null) : null;
    this._dtheta        = 0;
    this._reverse       = true;

    for (var k in this._nodes) {
        stats = this._nodes[k];
        data = this._items[k];
        var r = stats['r'];
        stats['rings']   = 0;
        stats['categories'] = new Array();
        stats['genres']     = new Array();
        var i = 0;
        for(var key in data) {
            stats['categories'].push(key.replace(/.*:/i,''));
            stats['genres'][i] = new Array();
            i++;
        }
        stats['rings'] = i;
        stats['padding'] = r*0.03;
        if (stats['padding'] < 2) { stats['padding'] = 2; }
        if (stats['padding'] > 6) { stats['padding'] = 6; }
        stats['innerRing'] = r*0.07; // inner ring at 7% of the radius
        stats['innerRingLineWidth'] = r/40.0; // why not?
        stats['innerBuffer'] = r*0.1;  // inner buffer is 10% of the radius
        stats['ringWidth'] = (r-stats['innerBuffer'])/stats['rings'];
    }

    function update() {
        if ( _me._timer.getRunning() || _me._redrawClock ) {
            var tick = false;
            delta = Math.abs( _me._timer.getTime() - _me._lastIntervalTime.getTime() );
            tick = delta >= ( 1000 / Math.abs(_me._timer.getSpeed()) - _me.drawTime )
            if ( tick ) {
                _me._dtheta = (_me._dtheta + _me._timer.getSpeed()*DEGREE2RADIAN) % PIx2;
                _me._lastIntervalTime = new Date( _me._timer.getTime() );
            }
            var t0 = new Date();
            _me.drawClock();
            var t1 = new Date();
            _me.drawTime = t1.getTime() - t0.getTime();
        }
        _me._timerIntervalID = requestAnimationFrame(update, null);
    }
}

Clock.prototype.drawClock = function() {
    this._ctx.globalCompositeOperation = 'destination-over';
    this._ctx.clearRect(0,0,this._canvas.width,this._canvas.height);

    // draw the nodes
    var t = timer.getTime();
    for (var k in this._nodes) {
        this.drawNode(this._nodes[k], this._items[k], t);
    }
    this._redrawClock = false;
};

Clock.prototype.drawNode = function(stats, data, t) {
    var ctx = this._ctx;
    var x = stats['x'];
    var y = stats['y'];
    var r = stats['r'];

    // draw the inner ring
    var innerRing = stats['innerRing'];
    ctx.lineWidth = stats['innerRingLineWidth'];
    ctx.strokeStyle = 'rgba(255,255,255,1.0)';
    ctx.beginPath();
    ctx.arc(x, y, innerRing, 0, PIx2, true);
    ctx.closePath();
    ctx.stroke();

    var rings = stats['rings'];
    if (rings<1)
        return;
 
    var innerBuffer = stats['innerBuffer'];
    var ringWidth   = stats['ringWidth'];
    var padding     = stats['padding'];

    var i = this._reverse ? rings : -1; // the ring number
    for(var key in data) {
        i += this._reverse ? -1 : 1;
        if (data.hasOwnProperty(key)) {
            startRadius    = innerBuffer + i*ringWidth     + (padding/2);
            endRadius      = innerBuffer + (i+1)*ringWidth - (padding/2);
            var direction  = i%2===0 ? -1 : 1; // direction of spin

            // inner lines
            ctx.lineWidth = 1.5;
            ctx.lineCap   = 'round';
            n = data[key].length;
            var last_genre=null, start_angle=0;
            var theta;
            for (var j=0; j<n; j++) {
                e = data[key][j];
                genre = e['genre']; // colour is determined by genre
                var a = 0.20; // default for events that are complete
                ps = e['performances'];
                for (var pt in ps) {
                    if (ps.hasOwnProperty(pt) && (t < pt) ) {
                        if (ps[pt]===0) {
                            a = 1.0; // if on, opacity at 1
                        }
                        else if (ps[pt]==1) {
                            dt = pt-t;
                            a = 0.4;
                            if (dt < this._fadetime) {
                                a += 0.6 * (1 - (this._fadetime-dt)/this._fadetime);
                            }
                        }
                        break;
                    }
                }
                ctx.strokeStyle = 'rgba('+
                        this._palette[genre][0]+','+
                        this._palette[genre][1]+','+
                        this._palette[genre][2]+','+a+')';

                theta = Math.PI*2 * j/n + (direction * this._dtheta);
                ctx.beginPath();
                ctx.moveTo( startRadius*Math.cos(theta) + x,
                            startRadius*Math.sin(theta) + y );
                ctx.lineTo( endRadius*Math.cos(theta) + x,
                            endRadius*Math.sin(theta) + y );
                ctx.stroke();

                // store the genre angles
                if (genre != last_genre) {
                    if (last_genre!==null)
                        stats['genres'][i][last_genre] = [start_angle%PIx2,theta%PIx2];
                    start_angle = theta;
                }
                last_genre = genre;
            }
            stats['genres'][i][last_genre] = [start_angle%PIx2,theta%PIx2];
        }
    }
};

/*
 * Selecting items
 */
// check which festival/ring/genre this show is in...
Clock.prototype.objectAtPoint = function(p) {
    p.x -= 8; p.y -= 8; // TODO: why??
    // Check if it's within one of the nodes
    for (var node in this._nodes) {
        var stats = this._nodes[node];
        dx = p.x - stats['x'];
        dy = p.y - stats['y'];
        var a2b2 = Math.pow(dx, 2) + Math.pow(dy, 2);
        if ( a2b2 <= Math.pow(stats['r'], 2) ) {
            var theta = Math.atan2(dy, dx);
            if ( theta<0 )
                theta = PIx2+theta;
            var r     = Math.sqrt(a2b2);
            // check which ring it's in
            if (r < stats['innerBuffer'])
                break; // none in inner buffer
            var i = Math.floor((r-stats['innerBuffer'])/stats['ringWidth']);
            var len = stats['categories'].length;
            // check which genre it is
            for ( var g in stats['genres'][i] ) {
                var angles = stats['genres'][i][g];
                if ( iBetween(theta, angles[0], angles[1], PIx2) ) {
                    var c = this._palette[g];
                    return {
                        node:stats['name'],
                        category:stats['categories'][this._reverse ? len-i-1 : i],
                        genre:g,
                        r:c[0], g:c[1], b:c[2], a:1
                    };
                }
            }
        }
    }
    return null;
};

function iBetween(i, x, y, max) {
    x %= max; y %= max;
    if (x==y) {
        x -= 0.2;
        y += 0.2;
    }
    if (x < 0)
        x = max + x;
    if (y < 0)
        y = max + y;
    return (i>=x && i<=y) || (x > y && ( i >= x || i <= y ) );
};
