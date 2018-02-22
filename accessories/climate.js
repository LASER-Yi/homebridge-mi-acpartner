const util = require('util');
const baseAC = require('./baseAC');

var Service, Characteristic, Accessory;

class ClimateAccessory {
    constructor(config, platform) {
        this.init(config, platform);
        Accessory = platform.Accessory;
        Service = platform.Service;
        Characteristic = platform.Characteristic;

        //Config
        this.maxTemp = parseInt(config.maxTemp) || 30;
        this.minTemp = parseInt(config.minTemp) || 17;
        this.syncInterval = config.syncInterval || 60*1000;
        this.autoStart = config.autoStart || "cool";
        this.outerSensor = config.sensorSid;
        if (config.customize) {
            this.customi = config.customize;
            this.log.debug("[DEBUG]Using customized AC signal...");
        }

        //Characteristic
        this.TargetHeatingCoolingState;
        this.TargetTemperature;
        this.CurrentTemperature;
        this.CurrentRelativeHumidity;

        //AC state
        this.model;
        this.active;
        this.mode;
        this.temperature;
        this.speed;
        this.swing;
        this.led;

        //Sync control
        setImmediate(() => this._stateSync());
        this.syncTimer = setInterval(() => {
            this._stateSync();
        }, this.syncInterval);

        this._setCharacteristic();
    }
    _setCharacteristic() {
        this.services = [];

        this.serviceInfo = new Service.AccessoryInformation();

        this.serviceInfo
            .setCharacteristic(Characteristic.Manufacturer, 'XiaoMi')
            .setCharacteristic(Characteristic.Model, 'AC Partner(Climate)')
            .setCharacteristic(Characteristic.SerialNumber, "Undefined");

        this.services.push(this.serviceInfo);

        //Register as Thermostat
        this.climateService = new Service.Thermostat(this.name);

        this.TargetHeatingCoolingState = this.climateService
            .getCharacteristic(Characteristic.TargetHeatingCoolingState)
            .on('set', this.setTargetHeatingCoolingState.bind(this));

        this.TargetTemperature = this.climateService
            .getCharacteristic(Characteristic.TargetTemperature)
            .setProps({
                maxValue: this.maxTemp,
                minValue: this.minTemp,
                minStep: 1
            })
            .on('set', this.setTargetTemperature.bind(this));

        this.CurrentTemperature = this.climateService
            .getCharacteristic(Characteristic.CurrentTemperature)
            .setProps({
                maxValue: 60,
                minValue: -20,
                minStep: 1
            })
            .updateValue((this.maxTemp + this.minTemp) / 2);

        if (this.outerSensor) {
            this.CurrentRelativeHumidity = this.climateService
                .addCharacteristic(Characteristic.CurrentRelativeHumidity)
                .setProps({
                    maxValue: 100,
                    minValue: 0,
                    minStep: 1
                })
                .updateValue(0);
        }

        this.services.push(this.climateService);
    }
    _updateState() {
        //Update AC mode and active state
        let chara_mode;
        if (this.active == 1) {
            switch (this.mode) {
                case 0:
                    //HEAT
                    chara_mode = Characteristic.TargetHeatingCoolingState.HEAT;
                    break;
                case 1:
                    //COOL
                    chara_mode = Characteristic.TargetHeatingCoolingState.COOL;
                    break;
                case 2:
                    //AUTO
                    chara_mode = Characteristic.TargetHeatingCoolingState.AUTO;
                    break;
            }
        } else {
            //OFF
            chara_mode = Characteristic.TargetHeatingCoolingState.OFF;
        }
        this.TargetHeatingCoolingState.updateValue(chara_mode);
        //Update TargetTemperature
        this.TargetTemperature.updateValue(this.temperature);
    }
    customiUtil() {
        let code = null;
        //Note: Some AC need 'on' signal to active. Add later.

        switch (this.TargetHeatingCoolingState.value) {
            case Characteristic.TargetHeatingCoolingState.HEAT:
                //HEAT
                if (!this.customi.heat || !this.customi.heat[this.TargetTemperature.value]) {
                    this.log.warn("[WARN]'HEAT' signal not define");
                } else {
                    code = this.customi.heat[this.TargetTemperature.value];
                }
                break;
            case Characteristic.TargetHeatingCoolingState.COOL:
                //COOL
                if (!this.customi.cool || !this.customi.cool[this.TargetTemperature.value]) {
                    this.log.warn("[WARN]'COOL' signal not define");
                } else {
                    code = this.customi.cool[this.TargetTemperature.value];
                }
                break;
            case Characteristic.TargetHeatingCoolingState.AUTO:
                //AUTO
                if (!this.customi.auto) {
                    this.log.warn("[WARN]'AUTO' signal not define");
                } else {
                    code = this.customi.auto;
                }
                break;
            case Characteristic.TargetHeatingCoolingState.OFF:
                //OFF
                if (!this.customi.off) {
                    this.log.warn("[WARN]'OFF' signal not define");
                } else {
                    code = this.customi.off;
                }
                break;
        }
        return code;
    }
    setTargetHeatingCoolingState(TargetHeatingCoolingState, callback) {
        //Note: Some AC need 'on' signal to active. Add later.
        //Change AC state value
        this.active = 1;
        switch (TargetHeatingCoolingState) {
            case Characteristic.TargetHeatingCoolingState.HEAT:
                this.mode = 0;
                break;
            case Characteristic.TargetHeatingCoolingState.COOL:
                this.mode = 1;
                break;
            case Characteristic.TargetHeatingCoolingState.AUTO:
                this.mode = 2;
                break;
            case Characteristic.TargetHeatingCoolingState.OFF:
                this.active = 0;
                break;
        }
        this._sendCmdAsync((ret) => {
            callback(ret);
        });
    }
    setTargetTemperature(TargetTemperature, callback) {
        //Note: 'autoStart' parameter need here; Add later.
        if (!this.outerSensor) {
            this.CurrentTemperature.updateValue(TargetTemperature);
        }
        this.temperature = TargetTemperature;
        if (this.active == 0) {
            switch (this.autoStart) {
                case "cool":
                    this.TargetHeatingCoolingState.updateValue(Characteristic.TargetHeatingCoolingState.COOL);
                    this.mode = 1;
                    break;
                case "heat":
                    this.TargetHeatingCoolingState.updateValue(Characteristic.TargetHeatingCoolingState.HEAT);
                    this.mode = 0;
                    break;
                case "auto":
                    this.TargetHeatingCoolingState.updateValue(Characteristic.TargetHeatingCoolingState.AUTO);
                    this.mode = 2;
                    break;
            }
        }

        this._sendCmdAsync((ret) => {
            callback(ret);
        });
    }
}

util.inherits(ClimateAccessory, baseAC);
module.exports = ClimateAccessory;