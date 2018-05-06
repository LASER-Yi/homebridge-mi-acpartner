const baseSwitch = require('./baseSwitch');

let Characteristic;

class SwitchRepeatAccessory extends baseSwitch {
    constructor(config, platform) {
        super(config, platform);
        Characteristic = platform.Characteristic;

        //Config
        this.sendInterval = config['sendInterval'] || 200;

        //Characteristic
        this.onState = Characteristic.On.NO;
        this.lastState = this.onState;

        //Code control
        this.code = [];
        this.codeIndex = 0;
        this.codeTimer;

        if (!config.data || !config.data.on || !config.data.off) {
            this.log.error("[ERROR]IR code no defined!");
        }
        this._setCharacteristic();
    }

    setSwitchState(value, callback) {
        //Judge code define
        if (!this.config.data || !this.config.data.on || !this.config.data.off) {
            this.log.error("[ERROR]IR code no defined!");
            return;
        }
        if (!this.platform.syncLock._enterSyncState(() => {
                this.setSwitchState(value, callback);
            })) {
            return;
        }

        this.onState = value;
        //Init code
        this.code = value ? this.config.data.on : this.config.data.off;
        this.codeIndex = 0;

        this.codeTimer = setInterval(() => {
            this._sendCode(this.code[this.codeIndex++]);
            if (this.codeIndex >= this.code.length) {
                //If send code fin, disable timer and callback;
                setTimeout(() => {
                    clearInterval(this.codeTimer);
                    this.platform.syncLock._exitSyncState();
                    callback();
                }, this.sendInterval / 2);
            }
        }, this.sendInterval);
    }
}
//util.inherits(SwitchRepeatAccessory, baseSwitch);
module.exports = SwitchRepeatAccessory;