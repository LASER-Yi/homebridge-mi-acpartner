var miio = require('miio');
var outputSignal = require("./packages/acSignal_handle");
var Accessory, Service, Characteristic;


module.exports = function(homebridge) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-mi-acpartner', 'XiaoMiAcPartner', XiaoMiAcPartner);
}

function XiaoMiAcPartner(log, config) {
    if(null == config) {
        this.log.error('[XiaoMiAcPartner][WARN] Cannot find config');
        return;
    }

    //Init
    var that = this;
    this.log = log;
    this.name = config.name;
    this.token = config.token;
    this.ip = config.ip;
    this.maxTemp = parseInt(config.maxTemp) || 30;
    this.minTemp = parseInt(config.minTemp) || 17;
    this.LastHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
    //this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
    //this.TargetTemperature = 26;

    this.PartnerState = JSON;
    this.PartnerState.power;
    this.PartnerState.mode;
    this.PartnerState.wind_force;
    this.PartnerState.sweep;
    this.PartnerState.temp;
    this.PartnerState.acModel;
    this.PartnerState.rtPower;

    if (config.customize == null) {
        this.config = config;
        this.customi = false;
        this.data = JSON;
        this.log("[XiaoMiAcPartner][INFO] Using presets...");
        var presets = require('./presets.json');
            if (!presets[config.brand] || !presets[config.brand][config.preset_no]) {
                this.log.error('[XiaoMiAcPartner][WARN] Brand or preset_no invalid');
            } else {
                this.data.model = this.config.brand;
                this.data.preset_no = this.config.preset_no;
                this.data.defaultState = Characteristic.TargetHeatingCoolingState;
            }        
    }else{
        this.customi = config.customize;
        this.log("[XiaoMiAcPartner][INFO] Using customized AC signal...");
    }

    this.services = [];

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
            maxValue: 30,
            minValue: 17,
            minStep: 1
        })
        .on('get', this.getCurrentTemperature.bind(this));;

    this.services.push(this.acPartnerService);

    this.serviceInfo = new Service.AccessoryInformation();

    this.serviceInfo
        .setCharacteristic(Characteristic.Manufacturer, 'XiaoMi')
        .setCharacteristic(Characteristic.Model, 'AC Partner');
    
    this.services.push(this.serviceInfo);

    this.discover();
    this.getACState(false);
}

XiaoMiAcPartner.prototype = {
    discover: function(){
        var accessory = this;
        var log = this.log;
        var token = this.token;
        this.log('[XiaoMiAcPartner][INFO] Searching AC Partner...');
        // Discover device in the network

        if (!this.ip) {
            log.debug('[XiaoMiAcPartner][DEBUG] Using miio...');
            var browser = miio.browse();
            
            browser.on('available', function(reg){
                if (!token) {
                    log.error('[XiaoMiAcPartner][WARN] token is invalid');
                    return;
                }
    
               if(reg.model != 'lumi.acpartner.v1' && reg.model != 'lumi.acpartner.v2') {
                    return;
                }
    
                reg.token = token;
    
                miio.device(reg)
                    .then(function(device){
                        if (devices.length > 0) {
                            return;
                        }
    
                        devices[reg.id] = device;
                        accessory.device = device;
                        log.debug('[XiaoMiAcPartner][INFO] Discovered "%s" (ID: %s) on %s:%s.', reg.hostname, device.id, device.address, device.port);
                    }).catch(function(e) {
                        if (devices.length > 0) {
                            return;
                        }
                        
                        log.error('[XiaoMiAcPartner][WARN] Device "%s" (ID: %s) register failed: %s (Maybe invalid token?)', reg.hostname, reg.id, e.message);
                    });
            }); 

            browser.on('unavailable', function(reg){
                if(reg.model != 'lumi.acpartner.v1' && reg.model != 'lumi.acpartner.v2') {
                    return;
                }
    
                var device = devices[reg.id];
                
                if(!device) {
                    return;
                }
    
                device.destroy();
                delete devices[reg.id];
            });
        }else{
            this.log.debug('[XiaoMiAcPartner][DEBUG] Using IP adrress...');
            accessory.device;
            miio.device({ address: this.ip, token: this.token })
                .then(function(device){
                    accessory.device = device;
                    log.debug('[XiaoMiAcPartner][DEBUG] Discovered "%s" (ID: %s) on %s:%s.', device.hostname, device.id, device.address, device.port);
                })
                .catch(log.error('[XiaoMiAcPartner][WARN] Cannot connect your AC Partner (Maybe invalid ip?)'));
        }
    },

    getTargetHeatingCoolingState: function(callback) {
        callback(null, this.TargetHeatingCoolingState);
    },

    setTargetHeatingCoolingState: function(TargetHeatingCoolingState, callback, context) {
        if(context !== 'fromSetValue') {
            this.TargetHeatingCoolingState = TargetHeatingCoolingState;
            if (this.TargetHeatingCoolingState == Characteristic.TargetHeatingCoolingState.OFF) {
                this.log("[XiaoMiAcPartner][INFO] AC turned off");
            }else{
                this.log.debug('[XiaoMiAcPartner][INFO] Set TargetHeatingCoolingState: ' + this.TargetHeatingCoolingState);
            }

            this.SendCmd();
        }
        callback();
    },

    getTargetTemperature: function(callback) {
        this.getACState(true);
        callback(null, this.TargetTemperature);
    },

    setTargetTemperature: function(TargetTemperature, callback, context) {
        if(context !== 'fromSetValue') {
              this.TargetTemperature = TargetTemperature;
              if (this.TargetHeatingCoolingState == Characteristic.TargetHeatingCoolingState.OFF) {
                this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;
                this.acPartnerService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
                    .updateValue(this.TargetHeatingCoolingState);
              }

            // Update current temperature
            this.acPartnerService
                .getCharacteristic(Characteristic.CurrentTemperature)
                .updateValue(parseFloat(TargetTemperature));

            this.log.debug('[XiaoMiAcPartner][DEBUG] Set temperature: ' + TargetTemperature);
            this.SendCmd();
        }

        callback();
    },

    getCurrentTemperature: function(callback) {
        this.log("[XiaoMiAcPartner][INFO] CurrentTemperature %s", this.TargetTemperature);
        callback(null, parseFloat(this.TargetTemperature));
    },

    identify: function(callback) {
        callback();
    },

    getServices: function() {
        return this.services;
    },

    SendCmd: function() {
        if (!this.device) {
            this.log.error('[XiaoMiAcPartner][WARN] Send signal failed!(Device not exists)');
            return;
        }

        var accessory = this;
        var code;
        this.log.debug("[XiaoMiAcPartner][DEBUG] Last TargetHeatingCoolingState: " + this.LastHeatingCoolingState);
        this.log.debug("[XiaoMiAcPartner][DEBUG] Current TargetHeatingCoolingState: " + this.TargetHeatingCoolingState);
        if (!this.customi) {
            this.data.CurrentTemperature = this.CurrentTemperature;
            this.data.TargetTemperature = this.TargetTemperature;
            this.data.TargetHeatingCoolingState = this.TargetHeatingCoolingState;
            this.data.LastHeatingCoolingState = this.LastHeatingCoolingState;
            var retCode = outputSignal(this.data);
            if (!retCode) {
                this.log.error('[XiaoMiAcPartner][WARN] Command code invalid, brand or preset_no not set right?')
                return;
            }
            //this.log.debug("[XiaoMiAcPartner][DEBUG] Get code: " + retCode.data);
            code = retCode.data;
            delete retCode;

        }else{
            if (this.LastHeatingCoolingState == Characteristic.TargetHeatingCoolingState.OFF && this.customi.on) {
                code = this.customi.on;
                this.log.debug("[XiaoMiAcPartner][DEBUG] AC on, sending code: " + code);
                this.device.call('send_cmd', [code]);
            }
            if (this.TargetHeatingCoolingState != Characteristic.TargetHeatingCoolingState.OFF) {
                if (this.TargetHeatingCoolingState == Characteristic.TargetHeatingCoolingState.HEAT) {
                    if (!this.customi||!this.customi.heat[this.TargetTemperature]) {
                        this.log.error('[XiaoMiAcPartner][WARN] HEAT Signal not define!');
                        return;
                    }
                    code = this.customi.heat[this.TargetTemperature];
                }else if (this.TargetHeatingCoolingState == Characteristic.TargetHeatingCoolingState.COOL){
                    if (!this.customi||!this.customi.cool[this.TargetTemperature]) {
                        this.log.error('[XiaoMiAcPartner][WARN] COOL Signal not define!');
                        return;
                    }
                    code = this.customi.cool[this.TargetTemperature];
                }else{
                    if (!this.customi||!this.customi.auto) {
                        this.log.error('[XiaoMiAcPartner][WARN] AUTO Signal not define! Will send COOL signal instead');
                        if (!this.customi||!this.customi.cool[this.TargetTemperature]) {
                            this.log.error('[XiaoMiAcPartner][WARN] COOL Signal not define!');
                            return;
                        }
                        code = this.customi.cool[this.TargetTemperature];
                    }else{
                        code = this.customi.auto;
                    }
                }
            }else{
                if (!this.customi||!this.customi.off) {
                    this.log.error('[XiaoMiAcPartner][WARN] OFF Signal not define!');
                    return;
                }
                code = this.customi.off;
            }
        }

        this.log.debug("[XiaoMiAcPartner][DEBUG] Sending code: " + code);
        this.device.call('send_cmd', [code])
            .then(function(data){
                if (data[0] == "ok") {
                    accessory.LastHeatingCoolingState = accessory.TargetHeatingCoolingState;
                    accessory.log.debug("[XiaoMiAcPartner][DEBUG] Change Successful");
                }else{
                    accessory.log.debug("[XiaoMiAcPartner][DEBUG] Unsuccess! Maybe invaild AC Code?");
                    accessory.getACState(true);
                }
            });
        delete code;
    },

    getACState: function(unsync){
        if (!unsync) {
            setTimeout(this.getACState.bind(this),5000);   
        }
        if (!this.device) {
            this.log.error("[XiaoMiAcPartner][WARN] Sync failed!(Device not exists)");
            return;
        }

        var acc = this;
        //this.log("[XiaoMiAcPartner][INFO] Syncing...")
        this.device.call('get_model_and_state', [])
            .then(function(retMaS){
                acc.PartnerState.rtPower = retMaS[2];
                acc.PartnerState.acModel = retMaS[0].substr(0,2) + retMaS[0].substr(8,8);
                acc.PartnerState.power = retMaS[1].substr(2,1);
                acc.PartnerState.mode = retMaS[1].substr(3,1);
                acc.PartnerState.wind_force = retMaS[1].substr(4,1);
                acc.PartnerState.sweep = retMaS[1].substr(5,1);
                acc.PartnerState.temp = parseInt(retMaS[1].substr(6,2),16);
                //acc.log.debug("[XiaoMiAcPartner][DEBUG] Partner_State:(model:%s, power_state:%s, mode:%s, wind:%s, sweep:%s, temp:%s, AC_POWER:%s",acc.PartnerState.acModel,acc.PartnerState.power,acc.PartnerState.mode,acc.PartnerState.wind_force,acc.PartnerState.sweep,acc.TargetTemperature,acc.PartnerState.rtPower);

                //update values
                if (acc.PartnerState.power == 1) {
                    if (acc.PartnerState.mode == 0) {
                        acc.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.HEAT;
                    }else if (acc.PartnerState.mode == 1) {
                        acc.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.COOL;
                    }else{
                        acc.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;
                    }
                }else{
                    acc.LastHeatingCoolingState = acc.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
                }
                acc.acPartnerService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
                    .updateValue(acc.TargetHeatingCoolingState);
                acc.TargetTemperature = acc.PartnerState.temp;
                acc.acPartnerService.getCharacteristic(Characteristic.TargetTemperature)
                    .updateValue(acc.TargetTemperature);
            });
    }
};
