const util = require('util');

const baseSwitch = require('./baseSwitch');

var Service, Characteristic, Accessory;

class LearnIRAccessory {
    constructor(config, platform) {
        this.init(config, platform);
        Accessory = platform.Accessory;
        Service = platform.Service;
        Characteristic = platform.Characteristic;

        //Characteristic
        this.activeState = null;
        this.onState = Characteristic.On.NO;
        this.lastState = this.onState;

        //value
        this.lastIRCode = undefined;
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
                    this.showIRCode();
                    setTimeout(() => {
                        this.setSwitchOff();
                    }, 30 * 1000);
                })
                .catch((err) => {
                    this.log.error("[ERROR]Start failed! " + err);
                    this._switchRevertState();
                })
                .then(() => {
                    callback();
                    this.platform._exitSyncState();
                });
        } else {
            //Switch off
            this.setSwitchOff(() => {
                callback();
            })
        }
    }
    setSwitchOff(callback) {
        this.platform.devices[this.deviceIndex].call('end_ir_learn', [])
            .then(() => {
                this.log("[%s]End IR learn", this.name);
                this._switchUpdateState();
                clearTimeout(this.closeTimer);
            }).catch((err) => {
                this.log.error("[ERROR]End failed! " + err);
                this._switchRevertState();
            })
            .then(() => {
                callback();
                this.platform._exitSyncState();
            });
    }
    showIRCode() {
        this.platform.devices[this.deviceIndex].call('get_ir_learn_result', [])
            .then((ret) => {
                let code = ret[0];
                if (code != '(null)' && code !== this.lastIRCode) {
                    this.lastIRCode = code;
                    this.log("[%s]IR code: %s", this.name, code);
                    this.closeTimer = setTimeout(() => {
                        this.showIRCode();
                    }, 500);
                }
            }).catch((err) => this.log.error("[ERROR]Learn Switch error! " + err));
    }
}
util.inherits(LearnIRAccessory, baseSwitch);
module.exports = LearnIRAccessory;