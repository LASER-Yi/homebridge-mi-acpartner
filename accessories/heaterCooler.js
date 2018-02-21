const util = require('util');
const baseAC = require('./baseAC');

var Service, Characteristic, Accessory;

class HeaterCoolerAccessory {
    constructor(config, platform) {
        this.init(config, platform);
        Accessory = platform.Accessory;
        Service = platform.Service;
        Characteristic = platform.Characteristic;

        //Config
        this.maxTemp = parseInt(config.maxTemp) || 30;
        this.minTemp = parseInt(config.minTemp) || 17;
        this.syncInterval = config.syncInterval || 60000;
        this.autoStart = config.autoStart || "cool";
        this.outerSensor = config.sensorSid;

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

        //Sync control
        setImmediate(() => this._stateSync());
        this.syncTimer = setInterval(() => {
            this._stateSync();
        }, this.syncInterval);

        //Add Characteristic
        this._setCharacteristic();
    }
    _setCharacteristic() {
        this.services = [];

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
            .on('set', this._setTargetHeaterCoolerState.bind(this));

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
            .getCharacteristic(Characteristic.CurrentHeaterCoolerState);

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
        this.active = (Active == Characteristic.Active.ACTIVE ? 1 : 0);
        this._sendCmdAsync(() => {
            callback();
        });
    }
    _setTargetHeaterCoolerState(TargetHeaterCoolerState, callback) {
        //this.CurrentHeaterCoolerState.updateValue(TargetHeaterCoolerState);
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
        }
        this._sendCmdAsync(() => {
            callback();
        });
    }

    _setCoolingThresholdTemperature(CoolingThresholdTemperature, callback) {
        if (!this.outerSensor) {
            this.CurrentTemperature.updateValue(CoolingThresholdTemperature);
        }
        this.temperature = CoolingThresholdTemperature;

        this._sendCmdAsync(() => {
            callback();
        });
    }

    _setHeatingThresholdTemperature(HeatingThresholdTemperature, callback) {
        if (!this.outerSensor) {
            this.CurrentTemperature.updateValue(HeatingThresholdTemperature);
        }
        this.temperature = HeatingThresholdTemperature;

        this._sendCmdAsync(() => {
            callback();
        });
    }

    _setSwingMode(SwingMode, callback) {
        this.swing = (SwingMode == Characteristic.SwingMode.SWING_ENABLE ? 1 : 0);
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
        //Update Active
        if (this.active == 1) {
            this.CActive.updateValue(Characteristic.Active.ACTIVE);
        } else {
            this.CActive.updateValue(Characteristic.Active.INACTIVE);
        }
        //Update Mode and Temperature
        let chara_mode;
        switch (this.mode) {
            case 0:
                //HEAT
                chara_mode = Characteristic.TargetHeaterCoolerState.HEAT;
                this.HeatingThresholdTemperature.updateValue(this.temperature);
                break;
            case 1:
                //COOL
                chara_mode = Characteristic.TargetHeaterCoolerState.COOL;
                this.CoolingThresholdTemperature.updateValue(this.temperature);
                break;
            case 2:
                //AUTO
                chara_mode = Characteristic.TargetHeaterCoolerState.AUTO;
                this.HeatingThresholdTemperature.updateValue(this.temperature + 2);
                this.CoolingThresholdTemperature.updateValue(this.temperature - 2);
                break;
        }
        this.TargetHeaterCoolerState.updateValue(chara_mode);
        //Update SwingMode
        this.SwingMode.updateValue(this.swing == 1 ? Characteristic.SwingMode.SWING_ENABLE : Characteristic.SwingMode.SWING_DISABLED);
        //Update RotationSpeed
        this.RotationSpeed.updateValue(this.speed);
    }
}

util.inherits(HeaterCoolerAccessory, baseAC);
module.exports = HeaterCoolerAccessory;