const util = require('util');
const baseSwitch = require('./baseSwitch');

var Service, Characteristic, Accessory;

class SwitchRepeatAccessory{
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
        this.code = null;
        this.codeIndex = 0;

        if (!config.data || !config.data.on || !config.data.off) {
            this.log.error("[ERROR]IR code no defined!");
        } else {
            this.log.debug("[%s]Code length: %s + %s", this.name, config.data.on.length, config.data.off.length);
        }
        this.setCharacteristic();
    }

    setCharacteristic() {
        this.services = [];

        this.infoService = new Service.AccessoryInformation();
        this.infoService
            .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
            .setCharacteristic(Characteristic.Model, "AC Partner IR Switch(M)")
            .setCharacteristic(Characteristic.SerialNumber, "Undefined");
        this.services.push(this.infoService);

        this.switchService = new Service.Switch(this.name);

        this.activeState = this.switchService.getCharacteristic(Characteristic.On)
            .on('set', this.setSwitchState.bind(this))
            .updateValue(this.onState);
        
        this.services.push(this.switchService);
    }

    setSwitchState(value,callback) {
        this.onState = value;
        this.code = value ? this.config.data.on : this.config.data.off;
        this.code.forEach(element => {
            
        });
        callback();
    }

    sendCmd(code, callback) {
        this.platform.devices[this.deviceIndex].call('send_ir_code', [code])
            .then((ret) => {
                this.log.debug("[%s]Return result: %s", this.name, ret);
            }).catch((err) => {
                this.log.error("[ERROR]Send failed! " + err);
            }).then(() => {
                callback();
            })
    }
}
util.inherits(SwitchRepeatAccessory, baseSwitch);
module.exports = SwitchRepeatAccessory;