const miio = require('miio');
const util = require('util');

const baseSwitch = require('./baseSwitch');

var Service, Characteristic, Accessory;

class SwitchAccessory {
    constructor(config, platform) {
        this.init(config, platform);
        Accessory = platform.Accessory;
        Service = platform.Service;
        Characteristic = platform.Characteristic;

        //Config reader
        this.onCode = this.offCode = undefined;
        //Characteristic
        this.onState = Characteristic.On.NO;
        this.lastState = this.onState;
        //value
        this.device = undefined;

        if (!config.data || !config.data.on || !config.data.off) {
            this.log.error("[%s]'data' not defined! Please check your 'config.json' file", this.name);
        } else {
            this.onCode = config.data.on;
            this.offCode = config.data.off;
        }
    }

    getServices() {
        this.services = [];

        this.infoService = new Service.AccessoryInformation();
        this.infoService
            .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
            .setCharacteristic(Characteristic.Model, "AC Partner IR Switch")
            .setCharacteristic(Characteristic.SerialNumber, "Undefined");
        this.services.push(this.infoService);

        this.switchService = new Service.Switch(this.name);

        this.activeState = this.switchService.getCharacteristic(Characteristic.On)
            .on('set', this.setSwitchState.bind(this))
            .updateValue(this.onState);
        this.services.push(this.switchService);

        return this.services;
    }
    setSwitchState(value, callback) {
        this.onState = value;
        let code = value ? this.onCode : this.offCode;

        this.log.debug("[%s]Sending IR code: %s", this.name, code);
        this.platform.conUtil.getDeviceByIndex(this.deviceIndex, ((device) => {
            device.call('send_ir_code', [code])
                .then((ret) => {
                    this._switchUpdateState();
                    this.log.debug("[%s]Result: %s", this.name, ret);
                    callback();
                }).catch((err) => {
                    this._switchRevertState();
                    this.log.error("[%s]Failed! " + err, this.name);
                    callback();
                });
        }));
    }
}

util.inherits(SwitchAccessory, baseSwitch);
module.exports = SwitchAccessory;