var now = require('jquery').now;

function Timer() {
    if(!(this instanceof Timer)) return new Timer();
}



Timer.prototype = {
    constructor: Timer,
    delay: function (fn, ms) {

        this.clear();

        this.rest_time = ms;
        this.start_time = now();
        // what about context? makeshift: use $.proxy:
        this.callback = fn;
        // make sure if we were at paused state, continue to pause:
        if(!this.paused) this.timer = setTimeout(fn, ms);


    },
    pause: function () {

        if(this.paused) return;
        var passed_time = now() - this.start_time;


        // We can do some extra check here (in case delay_time is less than passed_time due to system halt)
        this.rest_time = this.rest_time - passed_time;
        //console.log('rest:', this.rest_time);
        this.clear();
        this.paused = true;
    },
    resume: function () {
        if(!this.paused) return;
        this.paused = false;
        this.start_time = now();
        this.timer = setTimeout(this.callback, this.rest_time);
    },
    clear: function () {
        clearTimeout(this.timer);
        // maybe not necessary
        // this._destroy();
    },
    _destroy: function () {
        $.each(['callback', 'delay_time', 'timer', 'start_time', 'rest_time'], function (i, item) {
            this[item]=undefined;
        })
    }

};



module.exports = Timer;