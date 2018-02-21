const base = require('./base');
const util = require('util');

var Service, Characteristic, Accessory;

class baseAC {
    constructor(config, platform) {}

    _sendCmdAsync() {
        if (!this.platform._enterSyncState()) {
            this.platform.syncLockEvent.once("lockDrop", (() => {
                this._sendCmd();
            }));
            return;
        }
        clearTimeout(this._sendCmdTimer);
        this._sendCmdTimer = setTimeout(this._sendCmd.bind(this), 50);
    }
}

util.inherits(baseAC, base);
module.exports = baseAC;