const base = require('./base');

let Service, Characteristic, Accessory;

class baseSwitch extends base {
    constructor(config, platform) {
        super(config, platform);
        Accessory = platform.Accessory;
        Service = platform.Service;
        Characteristic = platform.Characteristic;
    }

    _setCharacteristic() {
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
    }

    _getModel() {
        const p1 = this.platform.devices[this.deviceIndex].call('get_model', [])
            .then((ret) => {
                this.model = ret[0];
            })
    }

    _sendCode(code, callback) {
        if (!this.ReadyState) {
            callback(new Error("Waiting for device state"));
            return;
        }
        if (!this.platform.syncLock._enterSyncState(() => {
                this.setSwitchState(value, callback);
            })) {
            return;
        }
        this.log.debug("[%s]Sending IR code: %s", this.name, code);
        this.platform.devices[this.deviceIndex].call('send_ir_code', [code])
            .then((ret) => {
                if (ret[0] === 'ok') {
                    this.log.debug("[%s]Result: %s", this.name, ret);
                    callback();
                } else {
                    throw new Error("Not vaild IR Code!");
                }
            })
            .catch((err) => {
                this.log.error("[%s]Failed! %s", this.name, err);
                callback(err);
            })
            .then(() => {
                this.platform.syncLock._exitSyncState();
            });
    }
}

//util.inherits(baseSwitch, base);
module.exports = baseSwitch;