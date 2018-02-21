const base = require('./base');
const util = require('util');

var Service, Characteristic, Accessory;

class baseSwitch {
    constructor(config, platform) {

    }
    _switchRevertState() {
        /**Revert last state */
        setTimeout(() => {
            this.onState = this.lastState;
            this.activeState.updateValue(this.onState);
        }, 100);
    }
    _switchUpdateState() {
        this.lastState = this.onState;
    }
}

util.inherits(baseSwitch, base);
module.exports = baseSwitch;