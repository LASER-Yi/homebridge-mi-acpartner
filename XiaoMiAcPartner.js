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
        this.log.error('[XiaoMiAcPartner][WARN] Cannot find config for AC Partner');
        return;
    }

    this.log = log;
    //this.log.debug("[XiaoMiAcPartner][DEBUG] Init");
    this.name = config.name;
    this.token = config.token;
    this.TargetTemperature = config.defaultTemp || 26;
    this.ip = config.ip;
    this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
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
            maxValue: 30,
            minValue: 17,
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
}

XiaoMiAcPartner.prototype = {
    discover: function(){
        var accessory = this;
        var log = this.log;
        var token = this.token;

        log.debug('[XiaoMiAcPartner][INFO] Searching AC Partner...');
        // Discover device in the network

        if (!this.ip) {

            log.debug('[XiaoMiAcPartner][DEBUG] Using miio...');
            var browser = miio.browse();
            
            browser.on('available', function(reg){
                if (!token) {
                    log.debug('token is invalid');
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
            log.debug('[XiaoMiAcPartner][DEBUG] Using IP adrress...');
            accessory.device = "3";
            miio.device({ address: this.ip, token: this.token })
                .then(function(device){
                    accessory.device = device;
                    log.debug('[XiaoMiAcPartner][INFO] Discovered "%s" (ID: %s) on %s:%s.', device.hostname, device.id, device.address, device.port);
                })
                .catch(log.error('[XiaoMiAcPartner][WARN] Cannot reach your AC Partner (Maybe invalid ip?)'));
                
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
        callback(null, this.TargetTemperature);
    },

    setTargetTemperature: function(TargetTemperature, callback, context) {
        if(context !== 'fromSetValue') {
              this.TargetTemperature = TargetTemperature;
              if (this.TargetHeatingCoolingState == Characteristic.TargetHeatingCoolingState.OFF) {
                this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;
                this.acPartnerService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
                    .updateValue(Characteristic.TargetHeatingCoolingState.AUTO)
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

        /*this.device.call('get_model_and_state', [])
            .then(function(nowState){

            }
        var test = 30;*/
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
            this.log.error('[XiaoMiAcPartner][WARN] Device not exists!');
            return;
        }

        this.log.debug("[XiaoMiAcPartner][DEBUG] Current TargetHeatingCoolingState: " + this.TargetHeatingCoolingState);
        if (!this.customi) {
            this.data.CurrentTemperature = this.CurrentTemperature;
            this.data.TargetTemperature = this.TargetTemperature;
            this.data.TargetHeatingCoolingState = this.TargetHeatingCoolingState;
            var retCode = outputSignal(this.data);
            if (!retCode) {
                this.log.error('[XiaoMiAcPartner][WARN] Command code invalid, brand or preset_no not set right?')
                return;
            }
            //this.log.debug("[XiaoMiAcPartner][DEBUG] Get code: " + retCode.data);
            var code = retCode.data;
            delete retCode;

        }else{
            if (this.TargetHeatingCoolingState != Characteristic.TargetHeatingCoolingState.OFF) {
                if (this.TargetHeatingCoolingState == Characteristic.TargetHeatingCoolingState.HEAT) {
                    if (!this.customi||!this.customi.heat[this.TargetTemperature]) {
                        this.log.error('[XiaoMiAcPartner][WARN] HEAT Signal not define!');
                        return;
                    }
                    var code = this.customi.heat[this.TargetTemperature];
                }else if (this.TargetHeatingCoolingState == Characteristic.TargetHeatingCoolingState.COOL){
                    if (!this.customi||!this.customi.cool[this.TargetTemperature]) {
                        this.log.error('[XiaoMiAcPartner][WARN] COOL Signal not define!');
                        return;
                    }
                    var code = this.customi.cool[this.TargetTemperature];
                }else{
                    if (!this.customi||!this.customi.auto) {
                        this.log.error('[XiaoMiAcPartner][WARN] AUTO Signal not define! Will send COOL signal instead');
                        if (!this.customi||!this.customi.cool[this.TargetTemperature]) {
                            this.log.error('[XiaoMiAcPartner][WARN] COOL Signal not define!');
                            return;
                        }
                        var code = this.customi.cool[this.TargetTemperature];
                    }else{
                        var code = this.customi.auto;
                    }
                }
            }else{
                if (!this.customi||!this.customi.off) {
                    this.log.error('[XiaoMiAcPartner][WARN] OFF Signal not define!');
                    return;
                }
                var code = this.customi.off;
            }
        }

        this.log.debug("[XiaoMiAcPartner][DEBUG] Sending code: " + code);
        this.device.call('send_cmd', [code])
            .then(function(returnVal){
                
            })
    }
};
