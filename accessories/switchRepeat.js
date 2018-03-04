const util = require('util');
const baseSwitch = require('./baseSwitch');

let Service, Characteristic, Accessory;

class SwitchRepeatAccessory {
    constructor(config, platform) {
        this.init(config, platform);
        Accessory = platform.Accessory;
        Service = platform.Service;
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
    _setCharacteristic() {
        this.services = [];

        this.infoService = new Service.AccessoryInformation();
        this.infoService
            .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
            .setCharacteristic(Characteristic.Model, "AC Partner IR Repeat Switch")
            .setCharacteristic(Characteristic.SerialNumber, "Undefined");
        this.services.push(this.infoService);

        this.switchService = new Service.Switch(this.name);

        this.activeState = this.switchService.getCharacteristic(Characteristic.On)
            .on('set', this.setSwitchState.bind(this))
            .updateValue(this.onState);

        this.services.push(this.switchService);
    }
    setSwitchState(value, callback) {
        //Judge code define
        if (!this.config.data || !this.config.data.on || !this.config.data.off) {
            this.log.error("[ERROR]IR code no defined!");
            return;
        }
        if (!this.platform._enterSyncState()) {
            this.platform.syncLockEvent.once("lockDrop", (() => {
                this.setSwitchState(value, callback);
            }));
            return;
        }

        this.onState = value;
        //Init code
        this.code = value ? this.config.data.on : this.config.data.off;
        this.codeIndex = 0;

        this.codeTimer = setInterval(() => {
            this._sendCmd(this.code[this.codeIndex++]);
            if (this.codeIndex >= this.code.length) {
                //If send code fin, disable timer and callback;
                setTimeout(() => {
                    clearInterval(this.codeTimer);
                    this.platform._exitSyncState();
                    callback();
                }, this.sendInterval / 2);
            }
        }, this.sendInterval);
    }
    _sendCmd(code) {
        this.platform.devices[this.deviceIndex].call('send_ir_code', [code])
            .then((ret) => {
                this.log.debug("[%s]Return result: %s", this.name, ret);
            })
            .catch((err) => {
                this.log.error("[ERROR]Send failed! $s", err);
            });
    }
}
util.inherits(SwitchRepeatAccessory, baseSwitch);
module.exports = SwitchRepeatAccessory;