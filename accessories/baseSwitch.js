const base = require('./base');

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

        var slot = Byte2Hex([121]);
        var command = code.slice(0, 2) + this.model.slice(4, 16) + "94701FFF" + slot + "FF" + code.slice(26, 32) + "27";
        var pre_sum = Hex2Byte(command);

        var sum = 0;
        pre_sum.forEach((value) => {
            sum += value;
        })

        var checksum = [sum & 0xFF];

        command = command + Byte2Hex(checksum) + code.slice(36);

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

//util.inherits(baseSwitch, base);
module.exports = baseSwitch;

const Hex2Byte = (str) => {
    let pos = 0;
    let len = str.length;
    if (len % 2 != 0) {
        return null;
    }
    len /= 2;
    let hex = new Array();
    for (let i = 0; i < len; i++) {
        let s = str.substr(pos, 2);
        let v = parseInt(s, 16);
        hex.push(v);
        pos += 2;
    }
    return hex;
}

const Byte2Hex = (bytes) => {
    let hexs = "";
    for (let i = 0; i < bytes.length; i++) {
        let hex = (bytes[i]).toString(16);

        if (hex.length == 1) {
            hexs += '0' + hex.toUpperCase();
        }
        hexs += hex.toUpperCase();
    }
    return hexs;
}