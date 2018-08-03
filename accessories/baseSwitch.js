const base = require('./base');
const signal = require('../lib/signalUtil');

let Service, Characteristic, Accessory;

class baseSwitch extends base {
    constructor(config, platform) {
        super(config, platform);
        Accessory = platform.Accessory;
        Service = platform.Service;
        Characteristic = platform.Characteristic;

        this.model = null;
    }

    _startAcc() {
        this._getModel();
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
        const p1 = this.platform.devices[this.deviceIndex].call('get_model_and_state', [])
            .then((ret) => {
                this.model = ret[0];
                this.ReadyState = true;
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

        var command = signal(this.model, code);

        this.log.debug("[%s]Sending IR code: %s", this.name, command);
        this.platform.devices[this.deviceIndex].call('send_ir_code', [command])
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

module.exports = baseSwitch;