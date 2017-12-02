const miio = require('miio');
const outputSignal = require("../packages/presetHandle");

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;

ClimateAccessory = function(log, config, platform){
    this.log = log;
    this.platform = platform;
    this.config = config;

    Accessory = platform.Accessory;
    PlatformAccessory = platform.PlatformAccessory;
    Service = platform.Service;
    Characteristic = platform.Characteristic;
    UUIDGen = platform.UUIDGen;

    //Config
    this.maxTemp = parseInt(config.maxTemp) || 30;
    this.minTemp = parseInt(config.minTemp) || 17;
    this.outerSensor = config.sensorSid;
    this.wiSync = config.sync || true;
    this.syncInterval = config.syncInterval || 60000;
    this.autoStart = config.autoStart;
    this.oscillate = config.oscillate || true;
    if (config.customize) {
        this.customi = config.customize;
        this.log.debug("[DEBUG]Using customized AC signal...");
    }else{
        this.data = JSON;
        this.data.defaultState = Characteristic.TargetHeatingCoolingState;
        this.log.debug("[DEBUG]Using presets...");
    }
    this.name = config['name'];

    //Init charact
    this.LastHeatingCoolingState = this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
    this.CurrentTemperature = 0;
    this.TargetTemperature = 0;
    this.CurrentRelativeHumidity = 0;
    this.model = null;
    if(null != this.config['ip'] && null != this.config['token']){
        this.ip = this.config['ip'];
        this.token = this.config['token'];
        this.connectService = setInterval(this.search.bind(this),3000);
        setTimeout(this.refresh.bind(this),600000);
    }else if(this.platform.globalDevice){
        Promise.all([this.platform.globalDevice])
            .then(() => {
                this.device = new Array();
                this.device = that.platform.device;
                this.log.debug("[%s]Global device connected",this.name);
                this.doRestThing();
            })
    }else{
        this.log.error("[%s]Cannot find device infomation",this.name);
    }

    this.services = [];

    var that = this;
    
    //Register as Thermostat
    this.acPartnerService = new Service.Thermostat(this.name);
    
    this.acPartnerService
        .getCharacteristic(Characteristic.TargetHeatingCoolingState)
        .on('set', this.setTargetHeatingCoolingState.bind(this))
        .on('get', this.getTargetHeatingCoolingState.bind(this));
    
    this.acPartnerService
        .getCharacteristic(Characteristic.TargetTemperature)
        .setProps({
            maxValue: that.maxTemp,
            minValue: that.minTemp,
            minStep: 1
        })
        .on('set', this.setTargetTemperature.bind(this))
        .on('get', this.getTargetTemperature.bind(this));
    
    this.acPartnerService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({
            maxValue: 60,
            minValue: -20,
            minStep: 1
        })
        .on('get', this.getCurrentTemperature.bind(this));;
    
    this.acPartnerService
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .setProps({
            maxValue: 100,
            minValue: 0,
            minStep: 1
        })
        .on('get', this.getCurrentRelativeHumidity.bind(this));
    
    this.services.push(this.acPartnerService);
    
    this.serviceInfo = new Service.AccessoryInformation();
    
    this.serviceInfo
        .setCharacteristic(Characteristic.Manufacturer, 'XiaoMi')
        .setCharacteristic(Characteristic.Model, 'AC Partner')
        .setCharacteristic(Characteristic.SerialNumber, "Undefined");
        
    this.services.push(this.serviceInfo);

}


ClimateAccessory.prototype = {
    doRestThing: function(){

        if (this.wiSync == true) {
            this.log.info("[CLIMATE]Auto sync on");
            this.getACState();  
        }else{
            this.TargetTemperature = (this.maxTemp + this.minTemp) / 2;
            this.log.info("[CLIMATE]Auto sync off");
        }
    },

    search: function(){
        if(this.platform.syncLock == true){
            return;
        }else{
            this.platform.syncLock = true;
            this.log.debug("[%s]Searching...",this.name);
            miio.device({ address: this.ip, token: this.token })
                .then((device) =>{
                    this.device = device;
                    this.log("[%s]Discovered Device!",this.name);
                    clearInterval(this.connectService);
                    this.doRestThing();
                    this.platform.syncLock = false;
                }).catch((err) =>{
                    this.log.error("[CLIMATE_ERROR]Cannot connect to AC Partner. " + err);
                    this.platform.syncLock = false;
                });
        }
    },

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
            }).catch((err) =>{
                this.log.error("[CLIMATE_ERROR]Refresh fail. " + err);
                this.platform.syncLock = false;
            })

    },

    getTargetHeatingCoolingState: function(callback) {
        callback(null, this.TargetHeatingCoolingState);
    },

    setTargetHeatingCoolingState: function(TargetHeatingCoolingState, callback, context) {
        if(context !== 'fromSetValue') {
            this.TargetHeatingCoolingState = TargetHeatingCoolingState;
            if (this.TargetHeatingCoolingState == Characteristic.TargetHeatingCoolingState.OFF) {
                this.log("[CLIMATE]AC turned off");
            }
            
            this.SendCmd();
        }
        callback();
    },

    getTargetTemperature: function(callback) {
        callback(null, this.TargetTemperature);
    },

    setTargetTemperature: function(TargetTemperature, callback, context) {
        if(context !== 'fromSetValue') {
              this.TargetTemperature = TargetTemperature;
              if (!this.autoStart && this.TargetHeatingCoolingState == Characteristic.TargetHeatingCoolingState.OFF) {
                this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;
                this.acPartnerService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
                    .updateValue(this.TargetHeatingCoolingState);
              }

            if (!this.outerSensor) {
                // Update CurrentTemperature
                this.acPartnerService
                    .getCharacteristic(Characteristic.CurrentTemperature)
                    .updateValue(parseFloat(TargetTemperature));
            }

            this.log.debug('[DEBUG]Set TargetTemperature: ' + TargetTemperature);
            this.SendCmd();
        }

        callback();
    },

    getCurrentTemperature: function(callback) {
        if (!this.outerSensor) {
            this.log("[CLIMATE]Set CurrentTemperature %s", this.TargetTemperature);
            callback(null, parseFloat(this.TargetTemperature));
        }else{
            callback(null, parseFloat(this.CurrentTemperature));
        }
    },

    getCurrentRelativeHumidity: function(callback){
        callback(null, parseFloat(this.CurrentRelativeHumidity));
    },

    identify: function(callback) {
        callback();
    },

    getServices: function() {
        return this.services;
    },

    onStart: function() {
        var code;
        var that = this;
        if (this.TargetHeatingCoolingState == Characteristic.TargetHeatingCoolingState.OFF && this.LastHeatingCoolingState == Characteristic.TargetHeatingCoolingState.OFF) {
            return;
        }
        if (this.LastHeatingCoolingState == Characteristic.TargetHeatingCoolingState.OFF && this.customi.on) {
            code = this.customi.on;
            if (code.substr(0,2) == "01") {
                this.log.debug("[DEBUG]AC on, sending AC code: " + code);
                this.device.call('send_cmd', [code])
                    .then(function(ret){
                        that.log.debug("[DEBUG]Return result: " + ret[0]);
                    }).catch(function(err){
                        that.log.error("[CLIMATE_ERROR]Send code fail! Error: " + err);
                    });
            }else{
                this.log.debug("[DEBUG] AC on, sending IR code: " + code);
                this.device.call('send_ir_code', [code])
                    .then(function(ret){
                        that.log.debug("[DEBUG]Return result: " + ret[0]);
                    }).catch(function(err){
                        that.log.error("[CLIMATE_ERROR]Send code fail! Error: " + err);
                    });
            }
        }
    },

    cusCodeHandle: function(){
        this.onStart();
        var code;
        if (this.TargetHeatingCoolingState != Characteristic.TargetHeatingCoolingState.OFF) {
            if (this.TargetHeatingCoolingState == Characteristic.TargetHeatingCoolingState.HEAT) {
                if (!this.customi||!this.customi.heat||!this.customi.heat[this.TargetTemperature]) {
                    this.log.error('[CLIMATE_ERROR]HEAT Signal not define!');
                    return;
                }
                code = this.customi.heat[this.TargetTemperature];
            }else if (this.TargetHeatingCoolingState == Characteristic.TargetHeatingCoolingState.COOL){
                if (!this.customi||!this.customi.cool||!this.customi.cool[this.TargetTemperature]) {
                    this.log.error('[CLIMATE_ERROR]COOL Signal not define!');
                    return;
                }
                code = this.customi.cool[this.TargetTemperature];
            }else{
                if (!this.customi||!this.customi.auto) {
                    this.log.error('[CLIMATE_ERROR]AUTO Signal not define! Will send COOL signal instead');
                    if (!this.customi||!this.customi.cool||!this.customi.cool[this.TargetTemperature]) {
                        this.log.error('[CLIMATE_ERROR]COOL Signal not define!');
                        return;
                    }
                    code = this.customi.cool[this.TargetTemperature];
                }else{
                    code = this.customi.auto;
                }
            }
        }else{
            if (!this.customi||!this.customi.off) {
                this.log.error('[CLIMATE_ERROR]OFF Signal not define!');
                return;
            }
            code = this.customi.off;
        }
        return code;
    },

    SendCmd: function() {
        if (!this.device) {
            this.log.error('[CLIMATE_ERROR]Send code failed!(Device not exists)');
            return;
        }

        if(this.model == null){
            this.getACState();
        }

        var accessory = this;
        var code;
        if (!this.customi) {
            this.data.model = this.model;
            this.data.oscillate = this.oscillate;
            this.data.TargetTemperature = this.TargetTemperature;
            this.data.TargetHeatingCoolingState = this.TargetHeatingCoolingState;
            this.data.LastHeatingCoolingState = this.LastHeatingCoolingState;
            var retCode = outputSignal(this.data);
            if (!retCode) {
                this.log.error('[CLIMATE_ERROR]Cannot get command code.')
                return;
            }
            //this.log.debug("[DEBUG] Get code: " + retCode.data);
            if (retCode.auto) {
                this.log.debug('[CLIMATE]You are using auto_gen code, if your AC don\'t response, please use customize method to control your AC.')
            }else{
                this.log.debug('[CLIMATE]Using preset: %s',retCode.model);
            }
            code = retCode.data;
            delete retCode;

        }else{
            code = this.cusCodeHandle();
            if (!code) {
                return;
            }
        }
        
        if (code.substr(0,2) == "01") {
            this.log.debug("[DEBUG]Sending AC code: " + code);
            this.device.call('send_cmd', [code])
                .then(function(data){
                    if (data[0] == "ok") {
                        accessory.LastHeatingCoolingState = accessory.TargetHeatingCoolingState;
                        accessory.log.debug("[DEBUG]Change Successful");
                    }else{
                        accessory.log.debug("[DEBUG]Unsuccess! Maybe invaild AC Code?");
                        if (accessory.wiSync) {
                            accessory.getACState();   
                        }
                    }
                }).catch(function(err){
                    that.log.error("[CLIMATE_ERROR]Send code fail! Error: " + err);
                });
        }else{
            this.log.debug("[DEBUG]Sending IR code: " + code);
            this.device.call('send_ir_code', [code])
                .then(function(data){
                    if (data[0] == "ok") {
                        accessory.LastHeatingCoolingState = accessory.TargetHeatingCoolingState;
                        accessory.log.debug("[DEBUG]Send Successful");
                    }else{
                        accessory.log.debug("[DEBUG]Unsuccess! Maybe invaild IR Code?");
                        if (accessory.wiSync) {
                            accessory.getACState();   
                        }
                    }
                }).catch(function(err){
                        accessory.log.error("[CLIMATE_ERROR]Send IR code fail! " + err);
                });
        }
    },

    getACState: function(){
        if (!this.device) {
            this.log.error("[CLIMATE_ERROR]Sync failed!(Device not exists)");
            return;
        }

        var that = this;
        this.log.debug("[CLIMATE_%s]Syncing...",this.name);

        //Update CurrentTemperature
        let p1 = this.outerSensor && this.device.call('get_device_prop_exp', [[this.outerSensor, "temperature", "humidity"]])
        .then(function(senRet){
            if (senRet[0][0] == null) {
                that.log.error("[CLIMATE_ERROR]Invaild sensorSid!")
            }else{
                that.log.debug("[CLIMATE]Temperature Sensor return:%s",senRet[0]);
                that.CurrentTemperature = senRet[0][0] / 100.0;
                that.CurrentRelativeHumidity = senRet[0][1] / 100.0;
                that.acPartnerService.getCharacteristic(Characteristic.CurrentTemperature).updateValue(that.CurrentTemperature);
                that.acPartnerService.getCharacteristic(Characteristic.CurrentRelativeHumidity).updateValue(that.CurrentRelativeHumidity);
            }
        }).catch((err) =>{
            this.log.error("[CLIMATE_ERROR]Current Temperature sync fail! " + err);
        });

        //Update AC state
        let p2 = this.device.call('get_model_and_state', [])
            .then(function(ret){
                //that.log(ret);
                that.acPower = ret[2];
                that.model = ret[0].substr(0,2) + ret[0].substr(8,8);
                var power = ret[1].substr(2,1);
                var mode = ret[1].substr(3,1);
                var wind_force = ret[1].substr(4,1);
                var sweep = ret[1].substr(5,1);
                var temp = parseInt(ret[1].substr(6,2),16);
                that.log.debug("[DEBUG]Partner_State:(model:%s, power_state:%s, mode:%s, wind:%s, sweep:%s, temp:%s, AC_POWER:%s",that.model,power,mode,wind_force,sweep,temp,that.acPower);

                //Update values
                if (power == 1) {
                    if (mode == 0) {
                        that.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.HEAT;
                    }else if (mode == 1) {
                        that.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.COOL;
                    }else{
                        that.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;
                    }
                }else{
                    that.LastHeatingCoolingState = that.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
                }
                that.acPartnerService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
                    .updateValue(that.TargetHeatingCoolingState);

                if (temp <= that.maxTemp && temp >= that.minTemp) {
                    that.TargetTemperature = temp;   
                }else{
                    that.TargetTemperature = that.maxTemp;
                }
                that.acPartnerService.getCharacteristic(Characteristic.TargetTemperature)
                    .updateValue(that.TargetTemperature);
            }).catch(function(err){
                that.log.error("[CLIMATE_ERROR]Sync fail! Error:" + err);
            });

        Promise.all([p1,p2])
            .catch(err => this.log.error("[CLIMATE_ERROR]Rediscover fail, error: " + err))
            .then(() => {
                this.log.debug("[CLIMATE]Sync complete")
                setTimeout(this.getACState.bind(this), this.syncInterval)
            });
    }
};
