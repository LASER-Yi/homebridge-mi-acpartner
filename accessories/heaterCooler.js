//Thanks to jayqizone
const miio = require('miio');
const presets = require("../presets.json");
const pack_SignalHandle = require("../lib/newPresetHandle");

var Service, Characteristic, Accessory;

HeaterCoolerAccessory = function(log, config, platform){
    this.log = log;
    this.platform = platform;
    this.config = config;

    Accessory = platform.Accessory;
    Service = platform.Service;
    Characteristic = platform.Characteristic;

    //Config
    this.maxTemp = parseInt(config.maxTemp) || 30;
    this.minTemp = parseInt(config.minTemp) || 17;
    this.LightState = config.lightState || false;
    this.outerSensor = config.sensorSid;
    this.syncInterval = config.syncInterval || 60000;
    this.data = JSON;
    this.data.defaultPresets = presets.default;
    this.name = config['name'];

    //Characteristics
    this.Active = Characteristic.Active.INACTIVE;
    this.TargetHeaterCoolerState = Characteristic.TargetHeaterCoolerState.AUTO;
    this.CoolingThresholdTemperature = (this.maxTemp + this.minTemp) / 2;
    this.HeatingThresholdTemperature = (this.maxTemp + this.minTemp) / 2;
    this.SwingMode = 0;
    this.RotationSpeed = 0;

    this.TargetTemperature = (this.maxTemp + this.minTemp) / 2;
    this.CurrentHeaterCoolerState = Characteristic.CurrentHeaterCoolerState.AUTO;
    this.CurrentTemperature;
    this.CurrentRelativeHumidity;

    //Add Characteristic
    this.hc_SetCharacteristic();
}

HeaterCoolerAccessory.prototype = {

    //Set Characteristic
    hc_SetCharacteristic: function(){
        var that = this;

        this.service = [];
        this.serviceInfo = new Service.AccessoryInformation();
        this.serviceInfo
            .setCharacteristic(Characteristic.Manufacturer, 'XiaoMi')
            .setCharacteristic(Characteristic.Model, 'AC Partner')
            .setCharacteristic(Characteristic.SerialNumber, "Undefined");
        this.service.push(this.serviceInfo);

        this.hc_Service = new Service.HeaterCooler(this.name);

        this.Active = this.hc_Service.getCharacteristic(Characteristic.Active)
            .on('set', this.hc_SetActive.bind(this));

        this.TargetHeaterCoolerState = this.hc_Service.getCharacteristic(Characteristic.TargetHeaterCoolerState)
            .on('set', this.hc_SetTargetHeaterCoolerState.bind(this));

        this.CoolingThresholdTemperature = this.hc_Service.addCharacteristic(Characteristic.CoolingThresholdTemperature)
            .setProps({
                maxValue: that.maxTemp,
                minValue: that.minTemp,
                minStep: 1
            })
            .on('set', this.hc_SetCoolingThresholdTemperature.bind(this))
            .updateValue(this.TargetTemperature);

        this.HeatingThresholdTemperature = this.hc_Service.addCharacteristic(Characteristic.HeatingThresholdTemperature)
            .setProps({
                maxValue: that.maxTemp,
                minValue: that.minTemp,
                minStep: 1
            })
            .on('set', this.hc_SetHeatingThresholdTemperature.bind(this))
            .updateValue(this.TargetTemperature);

        this.SwingMode = this.hc_Service.addCharacteristic(Characteristic.SwingMode)
            .on('set', this.hc_SetSwingMode.bind(this));

        this.RotationSpeed = this.hc_Service.addCharacteristic(Characteristic.RotationSpeed)
            .setProps({
                maxValue: 3,
                minValue: 0,
                minStep: 1
            })
            .on('set', this.hc_SetRotationSpeed.bind(this));

        this.CurrentHeaterCoolerState = this.hc_Service.getCharacteristic(Characteristic.CurrentHeaterCoolerState);
            
        this.CurrentTemperature = this.hc_Service.getCharacteristic(Characteristic.CurrentTemperature)
            .setProps({
                maxValue: 60,
                minValue: -20,
                minStep: 1
            })
            .updateValue((this.maxTemp + this.minTemp) / 2);

        if (this.outerSensor) {
            this.CurrentRelativeHumidity = this.hc_Service.getCharacteristic(Characteristic.CurrentRelativeHumidity)
                .setProps({
                    maxValue: 100,
                    minValue: 0,
                    minStep: 1
                })
                .updateValue(50);
        }
        
        this.service.push(this.hc_Service);
    },

    //Return this service to Homebridge
    getServices: function() {
        return this.service;
    },

    //Search AC Partner


    hc_SendCmdAsync: function(){
        this.localSyncLock = true;

        clearTimeout(this.hc_SendCmdTimeoutHandle);
        this.hc_SendCmdTimeoutHandle = setTimeout(this.hc_SendCmd.bind(this), 50);
    },

    hc_SendCmd: function(){
        this.localSyncLock = true;

        if (!this.device) {
            this.log.error('[ERROR]Send code failed!(Device not exists)');
            this.localSyncLock = false;
            return;
        }
        if(this.model == null){
            this.log('[INFO]Waiting for Sync state, please try again later');
            return;
        }

        let code;

        this.data.preset = this.preset;
        this.data.model = this.model;
        this.data.power = this.Active.value;
        this.data.mode;
        switch(this.TargetHeaterCoolerState.value){
            case Characteristic.TargetHeaterCoolerState.AUTO:
                this.data.mode = presets.default.mo.auto;
                this.data.tempera = this.TargetTemperature;
                break;
            case Characteristic.TargetHeaterCoolerState.COOL:
                this.data.mode = presets.default.mo.cooler;
                this.data.tempera = this.CoolingThresholdTemperature.value
                break;
            case Characteristic.TargetHeaterCoolerState.HEAT:
                this.data.mode = presets.default.mo.heater;
                this.data.tempera = this.HeatingThresholdTemperature.value;
                break;
        }
        this.data.SwingMode = this.SwingMode;
        this.data.RotationSpeed = this.RotationSpeed.value;
        this.data.LightState = this.LightState;
        code = pack_SignalHandle(this.data);

        this.log.debug("[DEBUG]Sending AC code: " + code);
        this.device.call('send_cmd', [code])
            .catch(err =>{
                this.log.error("[ERROR]Send code fail! Error: " + err);
            }).then(data =>{
                if (data[0] == "ok") {
                    this.log.debug("[DEBUG]Change Successful");
                }else{
                    this.log.debug("[DEBUG]Unsuccess! Maybe invaild AC Code?");
                }
                this.localSyncLock = false;
            })
    },

    //Refresh AC Partner Connection
    refresh: function(){
        if (this.platform.syncLock == true) {
            return;
        }
        this.platform.syncLock = true;

        this.log.debug("[%s]Refreshing...",this.name);
        miio.device({ address: this.ip, token: this.token })
            .then((device) =>{
                this.device = device;
                this.log("[%s]Device refreshed",this.name);
                this.platform.syncLock = false;
                this.hc_Sync();
            }).catch((err) =>{
                this.log.error("[ERROR]Refresh fail. " + err);
                this.platform.syncLock = false;
            })

    },

    //Sync Function
    hc_Sync: function(){
        if (!this.device && this.platform.syncLock) {
            setTimeout(this.hc_Sync.bind(this), 3000);
            return;
        }
        this.platform.syncLock = true;
        this.log.debug("[%s]Syncing...",this.name);

        //Update CurrentTemperature
        let p1 = this.outerSensor && this.device.call('get_device_prop_exp', [[this.outerSensor, "temperature", "humidity"]])
        .then((senRet) =>{
            if (senRet[0][0] == null) {
                this.log.error("[ERROR]Invaild sensorSid!")
            }else{
                this.log.debug("[DEBUG]Update Temperature to " + senRet[0][0] / 100.0);
                this.CurrentTemperature.updateValue(senRet[0][0] / 100.0);
                this.CurrentRelativeHumidity.updateValue(senRet[0][1] / 100.0);
            }
        }).catch((err) =>{
            this.log.error("[ERROR]Current Temperature sync fail! " + err);
        });

        //Update AC state
        let p2 = this.device.call('get_model_and_state', [])
            .then(ret =>{
                let model = ret[0],
                    state = ret[1],
                    power = ret[2];

                this.acPower = power;

                if (this.model !== model) {
                    this.model = model;
                    this.preset = presets[model.substr(0,2) + model.substr(8,8)];
                }

                let active, mode, speed, swing, temperature, led;
                active = state.substr(2,1) - 0;
                speed = state.substr(4,1) - 0 + 1;
                swing = 1 - state.substr(5,1);
                temperature = parseInt(state.substr(6,2),16);
                led = state.substr(8,1);
                
                this.TargetTemperature = temperature;

                //Update State
                switch (ret[1].substr(3,1)) {
                    case '0':
                        mode = Characteristic.TargetHeaterCoolerState.HEAT;
                        if (temperature <= this.maxTemp || temperature >= this.minTemp) {
                            this.HeatingThresholdTemperature.updateValue(temperature);   
                        }else{
                            this.log.error("[ERROR]Temperature out of range");
                            this.HeatingThresholdTemperature.updateValue(this.maxTemp);
                        }
                        break;
                    case '1':
                        mode = Characteristic.TargetHeaterCoolerState.COOL;
                        if (temperature <= this.maxTemp || temperature >= this.minTemp) {
                            this.CoolingThresholdTemperature.updateValue(temperature);
                        }else{
                            this.log.error("[ERROR]Temperature out of range");
                            this.CoolingThresholdTemperature.updateValue(this.maxTemp);
                        }
                        break;
                    case '2':
                        mode = Characteristic.TargetHeaterCoolerState.AUTO;
                        //Both Update
                        if (temperature <= this.maxTemp || temperature >= this.minTemp) {
                            this.CoolingThresholdTemperature.updateValue(temperature);
                            this.HeatingThresholdTemperature.updateValue(temperature);
                        }else{
                            this.log.error("[ERROR]Temperature out of range");
                            this.CoolingThresholdTemperature.updateValue(this.maxTemp);
                            this.HeatingThresholdTemperature.updateValue(this.maxTemp);
                        }
                        break;
                    default:
                        break;
                }

                this.Active.updateValue(active);
                this.TargetHeaterCoolerState.updateValue(mode);
                this.RotationSpeed.updateValue(speed);
                this.SwingMode.updateValue(swing);

                if (this.outerSensor == null) {
                    this.CurrentTemperature.updateValue(temperature);
                }
            }).catch((err) => {
                this.log.error("[ERROR]AC State Sync fail! Error:" + err);
            });

        Promise.all([p1,p2])
            .then(() => {
                this.platform.syncLock = false;
                this.log.debug("[HC]Sync complete");
                if (this.syncInterval > 0) {
                    setTimeout(this.hc_Sync.bind(this), this.syncInterval);
                }
            });
    },

    hc_SetActive(Active, callback){
        callback();

        this.hc_SendCmdAsync();
    },

    hc_SetTargetHeaterCoolerState(TargetHeaterCoolerState, callback){
        callback();

        this.CurrentHeaterCoolerState.updateValue(TargetHeaterCoolerState);

        this.hc_SendCmdAsync();
    },

    hc_SetCoolingThresholdTemperature(CoolingThresholdTemperature, callback){
        if (this.CoolingThresholdTemperature.value !== CoolingThresholdTemperature) {
            this.TargetTemperature = CoolingThresholdTemperature;
        }
        callback();

        //Power on
        this.Active.updateValue(Characteristic.Active.ACTIVE);

        if (!this.outerSensor) {
            this.CurrentTemperature.updateValue(CoolingThresholdTemperature);
        }

        this.hc_SendCmdAsync();
    },

    hc_SetHeatingThresholdTemperature(HeatingThresholdTemperature, callback){
        if (this.HeatingThresholdTemperature.value !== HeatingThresholdTemperature) {
            this.TargetTemperature = HeatingThresholdTemperature;
        }
        callback();

        //Power on
        this.Active.updateValue(Characteristic.Active.ACTIVE);

        if (!this.outerSensor) {
            this.CurrentTemperature.updateValue(HeatingThresholdTemperature);
        }

        this.hc_SendCmdAsync();
    },

    hc_SetSwingMode(SwingMode, callback){
        callback();

        this.hc_SendCmdAsync();
    },

    hc_SetRotationSpeed(RotationSpeed, callback){
        callback();

        this.hc_SendCmdAsync();
    }
}
