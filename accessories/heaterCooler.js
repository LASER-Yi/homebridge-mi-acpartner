const baseAC = require('./baseAC');

let Service, Characteristic, Accessory;

class HeaterCoolerAccessory extends baseAC {
    constructor(config, platform) {
        super(config, platform);
        Accessory = platform.Accessory;
        Service = platform.Service;
        Characteristic = platform.Characteristic;

        //Characteristic
        this.CActive;
        this.TargetHeaterCoolerState;
        this.CurrentHeaterCoolerState;
        this.CoolingThresholdTemperature;
        this.HeatingThresholdTemperature;
        this.SwingMode;
        this.RotationSpeed;
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

        //Add Characteristic
        this._setCharacteristic();
    }
    _setCharacteristic() {
        this.serviceInfo = new Service.AccessoryInformation();
        this.serviceInfo
            .setCharacteristic(Characteristic.Manufacturer, 'XiaoMi')
            .setCharacteristic(Characteristic.Model, 'AC Partner(HeaterCooler)')
            .setCharacteristic(Characteristic.SerialNumber, "Undefined");
        this.services.push(this.serviceInfo);

        this.hcService = new Service.HeaterCooler(this.name);

        this.CActive = this.hcService.getCharacteristic(Characteristic.Active)
            .on('set', this._setCActive.bind(this));

        this.TargetHeaterCoolerState = this.hcService
            .getCharacteristic(Characteristic.TargetHeaterCoolerState)
            .on('set', this._setTargetHeaterCoolerState.bind(this))
            .on('get', this._getTargetHeaterCoolerState.bind(this));

        this.CoolingThresholdTemperature = this.hcService
            .addCharacteristic(Characteristic.CoolingThresholdTemperature)
            .setProps({
                maxValue: this.maxTemp,
                minValue: this.minTemp,
                minStep: 1
            })
            .on('set', this._setCoolingThresholdTemperature.bind(this))
            .updateValue((this.minTemp + this.maxTemp) / 2);

        this.HeatingThresholdTemperature = this.hcService
            .addCharacteristic(Characteristic.HeatingThresholdTemperature)
            .setProps({
                maxValue: this.maxTemp,
                minValue: this.minTemp,
                minStep: 1
            })
            .on('set', this._setHeatingThresholdTemperature.bind(this))
            .updateValue((this.minTemp + this.maxTemp) / 2);

        this.SwingMode = this.hcService
            .addCharacteristic(Characteristic.SwingMode)
            .on('set', this._setSwingMode.bind(this));

        this.RotationSpeed = this.hcService
            .addCharacteristic(Characteristic.RotationSpeed)
            .setProps({
                maxValue: 3,
                minValue: 0,
                minStep: 1
            })
            .on('set', this._setRotationSpeed.bind(this));

        this.CurrentHeaterCoolerState = this.hcService
            .getCharacteristic(Characteristic.CurrentHeaterCoolerState)
            .on('set', this._setCurrentHeaterCoolerState.bind(this));

        this.CurrentTemperature = this.hcService
            .getCharacteristic(Characteristic.CurrentTemperature)
            .setProps({
                maxValue: 60,
                minValue: -20,
                minStep: 1
            })
            .updateValue((this.maxTemp + this.minTemp) / 2);

        if (this.outerSensor) {
            this.CurrentRelativeHumidity = this.hcService
                .addCharacteristic(Characteristic.CurrentRelativeHumidity)
                .setProps({
                    maxValue: 100,
                    minValue: 0,
                    minStep: 1
                })
                .updateValue(0);
        }

        this.services.push(this.hcService);
    }
    _setCActive(Active, callback) {
        this.active = (Active === Characteristic.Active.ACTIVE ? 1 : 0);
        this._sendCmdAsync(() => {
            callback();
        });
    }
    _getTargetHeaterCoolerState(callback) {
        this._fastSync();
        let state;
        switch (this.mode) {
            case 0:
                state = Characteristic.TargetHeaterCoolerState.HEAT;
                break;
            case 1:
                state = Characteristic.TargetHeaterCoolerState.COOL;
                break;
            default:
                state = Characteristic.TargetHeaterCoolerState.AUTO;
                break;
        }
        callback(null, state);
    }
    _setTargetHeaterCoolerState(TargetHeaterCoolerState, callback, context) {
        //this.CurrentHeaterCoolerState.updateValue(TargetHeaterCoolerState);
        if (context) {
            switch (TargetHeaterCoolerState) {
                case Characteristic.TargetHeaterCoolerState.HEAT:
                    this.mode = 0;
                    break;
                case Characteristic.TargetHeaterCoolerState.COOL:
                    this.mode = 1;
                    break;
                case Characteristic.TargetHeaterCoolerState.AUTO:
                    this.mode = 2;
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
    _setCurrentHeaterCoolerState(CurrentHeaterCoolerState, callback) {
        callback();
    }
    _setCoolingThresholdTemperature(CoolingThresholdTemperature, callback, context) {
        if (!this.outerSensor) {
            this.CurrentTemperature.updateValue(CoolingThresholdTemperature);
        }
        this.temperature = CoolingThresholdTemperature;
        if (context && this.active == 0) {
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
    _setHeatingThresholdTemperature(HeatingThresholdTemperature, callback, context) {
        if (!this.outerSensor) {
            this.CurrentTemperature.updateValue(HeatingThresholdTemperature);
        }
        this.temperature = HeatingThresholdTemperature;
        if (context && this.active == 0) {
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
    _setSwingMode(SwingMode, callback) {
        this.swing = (SwingMode === Characteristic.SwingMode.SWING_ENABLE ? 1 : 0);
        this._sendCmdAsync(() => {
            callback();
        });
    }
    _setRotationSpeed(RotationSpeed, callback) {
        this.speed = RotationSpeed;
        this._sendCmdAsync(() => {
            callback();
        });
    }
    _updateState() {
        //Update Mode and Temperature
        let target_mode;
        let current_mode;
        switch (this.mode) {
            case 0:
                //HEAT
                target_mode = Characteristic.TargetHeaterCoolerState.HEAT;
                current_mode = Characteristic.CurrentHeaterCoolerState.HEATING;
                this.HeatingThresholdTemperature.updateValue(this.temperature);
                break;
            case 1:
                //COOL
                target_mode = Characteristic.TargetHeaterCoolerState.COOL;
                current_mode = Characteristic.CurrentHeaterCoolerState.COOLING;
                this.CoolingThresholdTemperature.updateValue(this.temperature);
                break;
            default:
                //AUTO and others
                target_mode = Characteristic.TargetHeaterCoolerState.AUTO;
                if (this.temperature >= this.CurrentTemperature.value) {
                    current_mode = Characteristic.CurrentHeaterCoolerState.HEATING;
                    this.HeatingThresholdTemperature.updateValue(this.temperature);
                    this.CoolingThresholdTemperature.updateValue(this.maxTemp);
                } else {
                    current_mode = Characteristic.CurrentHeaterCoolerState.COOLING;
                    this.HeatingThresholdTemperature.updateValue(this.minTemp);
                    this.CoolingThresholdTemperature.updateValue(this.temperature);
                }
                break;
        }
        //Update Active
        if (this.active == 1) {
            this.CActive.updateValue(Characteristic.Active.ACTIVE);
        } else {
            this.CActive.updateValue(Characteristic.Active.INACTIVE);
            current_mode = Characteristic.CurrentHeaterCoolerState.INACTIVE;
        }
        this.TargetHeaterCoolerState.setValue(target_mode);
        this.CurrentHeaterCoolerState.setValue(current_mode);
        //Update SwingMode
        this.SwingMode.updateValue(this.swing === 1 ? Characteristic.SwingMode.SWING_ENABLE : Characteristic.SwingMode.SWING_DISABLED);
        //Update RotationSpeed
        this.RotationSpeed.updateValue(this.speed);
    }
}

//util.inherits(HeaterCoolerAccessory, baseAC);
module.exports = HeaterCoolerAccessory;