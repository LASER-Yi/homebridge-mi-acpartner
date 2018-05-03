const baseAC = require('./baseAC');

let Service, Characteristic, Accessory;

class ClimateAccessory extends baseAC {
    constructor(config, platform) {
        super(config, platform);
        Accessory = platform.Accessory;
        Service = platform.Service;
        Characteristic = platform.Characteristic;

        //Config
        this.maxTemp = parseInt(config.maxTemp, 10) || 30;
        this.minTemp = parseInt(config.minTemp, 10) || 17;
        if (config.syncInterval !== undefined) {
            this.syncInterval = parseInt(config.syncInterval, 10);
        } else {
            this.syncInterval = 60 * 1000;
        }
        this.autoStart = config.autoStart || "auto";
        this.outerSensor = config.sensorSid;

        //customize
        if (config.customize) {
            this.customi = config.customize;
            this.log.debug("[DEBUG]Using customized AC signal...");
        }

        //Characteristic
        this.TargetHeatingCoolingState;
        this.CurrentHeatingCoolingState;
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

        this._setCharacteristic();

        //Sync
        this._stateSync();
        if (this.syncInterval > 0) {
            this.syncTimer = setInterval(() => {
                this._stateSync();
            }, this.syncInterval);
        } else {
            this.log.info("[INFO]Sync off");
        }
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
            .on('set', this.setTargetHeatingCoolingState.bind(this))
            .on('get', this.getTargetHeatingCoolingState.bind(this));

        this.CurrentHeatingCoolingState = this.climateService
            .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
            .on('set', this.setCurrentHeatingCoolingState.bind(this));

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
            });

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
        let target_mode;
        let current_mode;
        if (this.active == '1') {
            switch (this.mode) {
                case "0":
                    //HEAT
                    target_mode = Characteristic.TargetHeatingCoolingState.HEAT;
                    current_mode = Characteristic.CurrentHeatingCoolingState.HEAT;
                    break;
                case "1":
                    //COOL
                    target_mode = Characteristic.TargetHeatingCoolingState.COOL;
                    current_mode = Characteristic.CurrentHeatingCoolingState.COOL;
                    break;
                default:
                    //AUTO
                    target_mode = Characteristic.TargetHeatingCoolingState.AUTO;
                    if (this.temperature >= this.CurrentTemperature.value) {
                        current_mode = Characteristic.CurrentHeatingCoolingState.HEAT;
                    } else {
                        current_mode = Characteristic.CurrentHeatingCoolingState.COOL;
                    }
                    break;
            }
        } else {
            //OFF
            target_mode = Characteristic.TargetHeatingCoolingState.OFF;
            current_mode = Characteristic.CurrentHeatingCoolingState.OFF;
        }
        this.CurrentHeatingCoolingState.setValue(current_mode);
        this.TargetHeatingCoolingState.setValue(target_mode);

        //Update TargetTemperature
        this.TargetTemperature.updateValue(this.temperature);
    }
    customiUtil(active, mode, temperature) {
        var code = "";
        let _temperature = parseInt(temperature, 10);
        //Note: Some AC need 'on' signal to active. Add later.

        if (active === 0) {
            if (this.customi.off !== undefined) {
                code = this.customi.off;
            } else {
                this.log.warn("[WARN]'OFF' signal no define");
            }
        } else {
            switch (mode) {
                case 0:
                    //heat
                    if (!this.customi.heat || !this.customi.heat[_temperature]) {
                        this.log.warn("[WARN]'HEAT' signal not define");
                    } else {
                        code = this.customi.heat[_temperature];
                    }
                    break;
                case 1:
                    //cool
                    if (!this.customi.cool || !this.customi.cool[_temperature]) {
                        this.log.warn("[WARN]'COOL' signal not define");
                    } else {
                        code = this.customi.cool[_temperature];
                    }
                    break;
                case 2:
                    //auto
                    if (!this.customi.auto) {
                        this.log.warn("[WARN]'AUTO' signal not define");
                    } else {
                        code = this.customi.auto;
                    }
                    break;
                default:
                    break;
            }
        }

        return code;
    }
    getTargetHeatingCoolingState(callback) {
        this._fastSync();
        let state = Characteristic.TargetHeatingCoolingState.OFF;
        switch (this.mode) {
            case "0":
                state = Characteristic.TargetHeatingCoolingState.HEAT;
                break;
            case "1":
                state = Characteristic.TargetHeatingCoolingState.COOL;
                break;
            case "2":
                state = Characteristic.TargetHeatingCoolingState.AUTO;
                break;
        }
        callback(null, state);
    }
    setTargetHeatingCoolingState(TargetHeatingCoolingState, callback, context) {
        //Note: Some AC need 'on' signal to active. Add later.
        //Change AC state value
        if (context) {
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
                default:
                    break;
            }
            this._sendCmdAsync((ret) => {
                callback(ret);
            });
        } else {
            callback();
        }
    }
    setCurrentHeatingCoolingState(CurrentHeatingCoolingState, callback) {
        callback();
    }
    setTargetTemperature(TargetTemperature, callback, context) {
        //TODO: 'autoStart' parameter need here; Add later.
        if (!this.outerSensor) {
            this.CurrentTemperature.updateValue(TargetTemperature);
        }
        this.temperature = TargetTemperature;
        //Update state for autoStart parameter.
        if (context && this.active === "0") {
            switch (this.autoStart) {
                case "cool":
                    this.mode = 1;
                    this.active = 1;
                    break;
                case "heat":
                    this.mode = 0;
                    this.active = 1;
                    break;
                case "auto":
                    this.mode = 2;
                    this.active = 1;
                    break;
                default:
                    break;
            }
            this._updateState();
        }
        this._sendCmdAsync((ret) => {
            callback(ret);
        });
    }
}

//util.inherits(ClimateAccessory, baseAC);
module.exports = ClimateAccessory;