/*
 * Copyright (c) 2011 Justin Quillinan - http://justinq.net
 * GPL version 3 or later (see http://www.gnu.org/copyleft/gpl.html)
 */

/*
 * Timer class providing pause, fastforward, rewind, etc.
 */

function Timer(currentDate, startDate, endDate) {
    var _me = this;
    this._min = new Date(Date.parseString(startDate, 'yyyy-MM-dd HH:mm:ss'));
    this._max = new Date(Date.parseString(endDate, 'yyyy-MM-dd HH:mm:ss'));

    /*
     * this is just for the festival clock - should remove to reuse
     * first date starts at 6am, last date ends at 6am the following day
     */
    this._min.setHours(6);
    this._min.setMinutes(0);
    this._min.setSeconds(0);
    this._max.setDate( this._max.getDate()+1 );
    this._max.setHours(6);
    this._max.setMinutes(0);
    this._max.setSeconds(0);

    this.setDate(currentDate);
    this.setRunning(true);
    this._speed     = 1; // 1 is normal
    this._speedMax  = 4;
    this._lastIntervalTime = new Date();
    this._timerIntervalID = requestAnimationFrame(update, null);

    function update() {
        if (_me._running) {
            t = new Date();
            delta = t.getTime() - _me._lastIntervalTime.getTime();
            switch( Math.abs(_me._speed) ) {
                case 1: // 1:1
                    break;
                case 2: // 1 min
                    delta *= 60;
                    break;
                case 3: // 1 hour
                    delta *= 3600;
                    break;
                case 4: // 1 day
                    delta *= 86400;
                    break;
                default:
                    break;
            }
            if ( _me._speed < 0 )
                delta = -delta;
            _me.addTime( delta );
            _me._lastIntervalTime = t;
        }
        requestAnimationFrame(update, null);
    }
}

Timer.prototype.getYear    = function() { return this._d.getYear(); };
Timer.prototype.getMonth   = function() { return this._d.getMonth(); };
Timer.prototype.getDay     = function() { return this._d.getDate(); };
Timer.prototype.getHours   = function() { return this._d.getHours(); };
Timer.prototype.getMinutes = function() { return this._d.getMinutes(); };
Timer.prototype.getSeconds = function() { return this._d.getSeconds(); };

Timer.prototype.getDate = function() { return this._d; };

Timer.prototype.setDate = function(dateStr) {
    var date = new Date(Date.parseString(dateStr, 'yyyyMMddHHmmss'));
    // if date is invalid use current date
    if (!date.valueOf()) {
        d = new Date();
        // use the UTC date
        date = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours()+1, d.getUTCMinutes(), d.getUTCSeconds()); // +1 for DST festival time
    }
    // if outside the date bounds, set to the start date
    if (date < this._min || date > this._max)
        date = new Date(this._min.getTime());
    this._d = date;
};

Timer.prototype.getTime = function() {
    return this._d.getTime();
};

Timer.prototype.setTime = function(t) {
    this._d.setTime(t);
    if ( this._d < this._min ) {
        this.setTime( this._min.getTime() );
        //this._running = false;
        this._speed = 1;
    }
    if ( this._d > this._max ) {
        this.setTime( this._max.getTime() );
        //this._running = false;
        this._speed = -1;
    }
};

Timer.prototype.addTime = function(t) {
    this.setTime( this._d.getTime() + t );
};

Timer.prototype.getStartDate = function() {
    return this._min;
};

Timer.prototype.getEndDate = function() {
    return this._max;
};

Timer.prototype.monthNames = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
];

Timer.prototype.getMonthStr = function() {
    return this.monthNames[this.getMonth()];
};

Timer.prototype.getMonthStrShort = function() {
    return this.getMonthStr().substr(0, 3);
};

Timer.prototype.getDateStr = function() {
    return this.getDay() + " " + this.getMonthStr() /* this.getYear() */;
};

Timer.prototype.getTimeStr = function() {
    var hours   = this.getHours();
    var minutes = this.getMinutes();
    var seconds = this.getSeconds();

    // Pad the minutes and seconds with leading zeros, if required
    minutes = ( minutes < 10 ? "0" : "" ) + minutes;
    seconds = ( seconds < 10 ? "0" : "" ) + seconds;
    // Choose either "AM" or "PM" as appropriate
    //            var timeOfDay = ( hours < 12 ) ? "AM" : "PM";
    // Convert the hours component to 12-hour format if needed
    //hours = ( hours > 12 ) ? hours - 12 : hours;
    
    // Convert an hours component of "0" to "12"
    hours = ( hours === 0 ) ? 24 : hours;
    
    // Compose the string for display
    return hours + ":" + minutes + ":" + seconds /*+ " " +   timeOfDay*/;
};

// Play/Pause
Timer.prototype.getRunning = function() { return this._running; };
Timer.prototype.setRunning = function(running) {
    if (running)
        this._lastIntervalTime = new Date();
    this._running = running;
};

Timer.prototype.togglePlay  = function() { this.setRunning(!this._running); };
Timer.prototype.pause       = function() { this.setRunning(false); };
Timer.prototype.resume      = function() { this.setRunning(true); };

// Speed
Timer.prototype.getSpeed = function() { return this._speed; };
Timer.prototype.setSpeed = function(s) {
    if (s > this._speedMax) { this._speed = this._speedMax; }
    else if (s < -this._speedMax) { this._speed = -this._speedMax; }
    else if (s === 0) { this._speed = 1; }
    else { this._speed = s; }
};

Timer.prototype.increaseSpeed = function() {
    this.setSpeed( this._speed == -1 ? 1 : this._speed+1 );
};

Timer.prototype.decreaseSpeed = function() {
    this.setSpeed( this._speed == 1 ? -1 : this._speed-1 );
};

Timer.prototype.jumpToStart = function() {
    r = this.getRunning();
    this.pause();
    this.setTime( this._min.getTime() );
    this.setRunning(r);
};

Timer.prototype.jumpToEnd   = function() {
    r = this.getRunning();
    this.pause();
    this.setTime( this._max.getTime() );
    this.setRunning(r);
};

