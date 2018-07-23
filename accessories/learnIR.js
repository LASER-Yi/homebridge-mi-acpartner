const baseSwitch = require('./baseSwitch');

let Characteristic;

class LearnIRAccessory extends baseSwitch {
    constructor(config, platform) {
        super(config, platform);
        Characteristic = platform.Characteristic;

        //Characteristic
        this.activeState = null;
        this.onState = Characteristic.On.NO;
        this.lastState = this.onState;

        //value
        this.lastIRCode;
        this.closeTimer;

        this._setCharacteristic();
    }

    setSwitchState(value, callback) {
        if (!this.ReadyState) {
            callback(new Error("Waiting for device state"));
            return;
        }
        if (!this.platform.syncLock._enterSyncState(() => {
                this.setSwitchState(value,callback);
            })) {
            return;
        }
        this.onState = value;

        if (value) {
            //Switch on
            this.platform.devices[this.deviceIndex].call('start_ir_learn', [30])
                .then(() => {
                    this.log("[%s]Start learning", this.name);
                    this.closeTimer = setInterval(() => {
                        this.showIRCode();
                    }, 500);
                    setTimeout(() => {
                        clearInterval(this.closeTimer);
                        this.activeState.updateValue(Characteristic.On.NO);
                    }, 30 * 1000);
                    callback();
                })
                .catch((err) => {
                    this.log.error("[ERROR]Start failed! %s", err);
                    callback(err);
                })
                .then(() => {
                    this.platform.syncLock._exitSyncState();
                });
        } else {
            //Switch off
            this.platform.devices[this.deviceIndex].call('end_ir_learn', [])
                .then(() => {
                    this.log("[%s]End learning", this.name);
                    callback();
                })
                .catch((err) => {
                    this.log.error("[ERROR]End failed! %s", err);
                    callback(err);
                })
                .then(() => {
                    clearInterval(this.closeTimer);
                    this.platform.syncLock._exitSyncState();
                });
        }
    }
    showIRCode() {
        this.platform.devices[this.deviceIndex].call('get_ir_learn_result', [])
            .then((ret) => {
                const code = ret[0];
                if (code !== '(null)' && code !== this.lastIRCode) {
                    this.lastIRCode = code;
                    //Recovert the return IR code to new code
                    let _code = code.substr(0, 14) + "94701FFF96FF" + code.substr(26);
                    this.log("[%s]IR Code: %s", this.name, _code);
                    //When got result, turn off the switch on homekit
                    this.activeState.setValue(Characteristic.On.NO);
                }
            })
            .catch((err) => this.log.error("[ERROR]Learn Switch error! %s", err));
    }
}
//util.inherits(LearnIRAccessory, baseSwitch);
module.exports = LearnIRAccessory;