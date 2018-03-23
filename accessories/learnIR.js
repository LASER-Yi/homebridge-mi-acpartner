const baseSwitch = require('./baseSwitch');

let Service, Characteristic, Accessory;

class LearnIRAccessory extends baseSwitch {
    constructor(config, platform) {
        super(config, platform);
        Accessory = platform.Accessory;
        Service = platform.Service;
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
    _setCharacteristic() {
        this.services = [];

        this.infoService = new Service.AccessoryInformation();
        this.infoService
            .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
            .setCharacteristic(Characteristic.Model, "AC Partner Learn Switch")
            .setCharacteristic(Characteristic.SerialNumber, "Undefined");
        this.services.push(this.infoService);

        this.switchService = new Service.Switch(this.name);

        this.activeState = this.switchService.getCharacteristic(Characteristic.On)
            .on('set', this.setSwitchState.bind(this))
            .updateValue(this.onState);

        this.services.push(this.switchService);
    }
    setSwitchState(value, callback) {
        if (!this.platform._enterSyncState()) {
            this.platform.syncLockEvent.once("lockDrop", (() => {
                this.setSwitchState(value, callback);
            }));
            return;
        }
        this.onState = value;

        if (value) {
            //Switch on
            this.platform.devices[this.deviceIndex].call('start_ir_learn', [30])
                .then(() => {
                    this._switchUpdateState();
                    this.log("[%s]Start IR learn", this.name);
                    this.closeTimer = setInterval(() => {
                        this.showIRCode();
                    }, 500);
                    setTimeout(() => {
                        clearInterval(this.closeTimer);
                        this.activeState.updateValue(Characteristic.On.NO);
                    }, 30 * 1000);
                })
                .catch((err) => {
                    this.log.error("[ERROR]Start failed! %s", err);
                    this._switchRevertState();
                })
                .then(() => {
                    callback();
                    this.platform._exitSyncState();
                });
        } else {
            //Switch off
            this.platform.devices[this.deviceIndex].call('end_ir_learn', [])
                .then(() => {
                    this.log("[%s]End IR learn", this.name);
                    this._switchUpdateState();
                })
                .catch((err) => {
                    this.log.error("[ERROR]End failed! %s", err);
                    this._switchRevertState();
                })
                .then(() => {
                    clearInterval(this.closeTimer);
                    this.platform._exitSyncState();
                    callback();
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