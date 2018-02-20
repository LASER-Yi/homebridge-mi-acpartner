const miio = require('miio');
const baseSwitch = require('./baseSwitch');

var Service, Characteristic, Accessory;

class LearnIRAccessory {
    constructor(config, platform) {
        this.init(config, platform);
        Accessory = platform.Accessory;
        Service = platform.Service;
        Characteristic = platform.Characteristic;

        //Characteristic
        this.onState = Characteristic.On.NO;
        this.lastState = this.onState;

        //value
        this.lastIRCode = undefined;
        this.closeTimer;
    }
    getServices() {
        this.services = [];

        platform.log.debug("[%s]Initializing learnIR", this.name);

        this.infoService = new Service.AccessoryInformation();
        this.infoService
            .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
            .setCharacteristic(Characteristic.Model, "AC Partner Learn Switch")
            .setCharacteristic(Characteristic.SerialNumber, "Undefined");
        this.services.push(this.infoService);

        this.switchService = new Service.Switch(this.name);

        this.activeState = this.switchService
            .getCharacteristic(Characteristic.On)
            .on('set', this.setSwitchState.bind(this))
            .updateValue(this.onState);

        this.services.push(this.switchService);
    }
    showIRCode() {
        this.device.call('get_ir_learn_result', [])
            .then((ret) => {
                let code = ret[0];
                if (code != '(null)' || code !== this.lastIRCode) {
                    this.lastIRCode = code;
                    this.log("[%s]IR Code: %s", this.name, code);
                }
            }).catch((err) => this.log.error("[ERROR]Learn Switch error! " + err));
    }
}

LearnIRAccessory.prototype = {

    autoClo: function () {
        this.log.info("[%s]Auto Stop Learning...", this.name);
        clearInterval(this.autoStop);
        this.onState = false;
        this.switchService.getCharacteristic(Characteristic.On).updateValue(false);
    },

    setSwitchState: function (value, callback) {
        this.onState = value;

        if (value) {
            this.device.call('start_ir_learn', [30])
                .then(() => {
                    this.log.info("[%s]Start Learning...Auto stop after 30 seconds", this.name);
                    this.showIRCode();
                    this.closeTimer = setInterval(this.autoClo.bind(this), 30000);
                    callback();
                }).catch((err) => this.log.error("[ERROR]Start fail! " + err));
        } else {
            this.device.call('end_ir_learn', [])
                .then(() => {
                    this.log.info("[%s]Stop Learning...", this.name);
                    clearInterval(this.autoStop);
                    callback();
                }).catch((err) => this.log.error("[ERROR]End fail! " + err))
        }
    }
}