const base = require('./base');
const util = require('util');

var Service, Characteristic, Accessory;

class baseSwitch{
    constructor(config, platform) {
        
    }
    _switchRevertState() {
        /**Revert last state */
        this.onState = this.lastState;
        this.activeState.updateValue(this.onState);
    }
    _switchUpdateState() {
        this.lastState = this.onState;
    }
}

util.inherits(baseSwitch, base);
module.exports = baseSwitch;