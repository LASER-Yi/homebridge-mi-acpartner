const baseSwitch = require('./baseSwitch');

let Characteristic;

class SwitchAccessory extends baseSwitch {
    constructor(config, platform) {
        super(config, platform);
        Characteristic = platform.Characteristic;

        //Config reader
        this.onCode;
        this.offCode;
        //Characteristic
        this.activeState = null;
        this.onState = Characteristic.On.NO;
        this.lastState = this.onState;

        if (!config.data || !config.data.on || !config.data.off) {
            this.log.error("[%s]'data' not defined! Please check your 'config.json' file", this.name);
        } else {
            this.onCode = config.data.on;
            this.offCode = config.data.off;
        }
        this._setCharacteristic();
    }
    
    setSwitchState(value, callback) {
        if (!this.onCode || !this.offCode) {
            var err = new Error("IR code no defined!")
            this.log.error("[ERROR]"+err);
            callback(err);
            return;
        }
        this.onState = value;
        const code = this.onState ? this.onCode : this.offCode;

        this._sendCode(code, (err) => {
            callback(err);
        })
    }
}

//util.inherits(SwitchAccessory, baseSwitch);
module.exports = SwitchAccessory;