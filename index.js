var miio = require('miio');
var Accessory, Service, Characteristic, customi = true;

module.exports = function(homebridge) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-Mi-acPartner', 'XiaoMiAcPartner', XiaoMiAcPartner);
}

function XiaoMiAcPartner(log, config) {
    //init
    this.log = log;
    this.log.debug("[XiaoMiAcParner][DEBUG] Init");
    this.name = config.name || 'AcPartner';
    this.token = config.token;
    this.TargetTemperature = config.defaultTemp || 26;
    this.ip = config.ip;

    this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
    if (config.customize == null) {
        customi = false;
        this.log("[XiaoMiAcParner][INFO] Using presets...");
        var presets = require('./presets.json');
            if (!presets[config.brand] || !presets[config.brand][config.preset_no]) {
                log.error('Brand or preset_no invalid');
            } else {
                this.codeTpl = presets[config.brand][config.preset_no];
            }        
    }else{
        this.UserCustomized = config.customize;
        this.log("[XiaoMiAcParner][INFO] Using user customized IR signal...");
        if(!this.UserCustomized.off){
            this.log("[XiaoMiAcParner][WARN] Cannot find off IR signal!!!");
        }else{
            this.offSignal = this.UserCustomized.off;
        }
        if(!this.UserCustomized.cool){
            this.log("[XiaoMiAcParner][WARN] Cannot find cool mode IR signal!");
        }else{
            this.coolSignal = new Array();
            coolSignal = this.UserCustomized.cool;
        }
        if(!this.UserCustomized.heat){
            this.log("[XiaoMiAcParner][WARN] Cannot find heat mode IR signal!");
        }else{
            this.heatSigal = new Array();
            heatSignal = this.UserCustomized.heat;
        }
    }

    this.services = [];

    this.stateMaps = {
        4: "3",
        3: "2",
        2: "1",
        1: "0",
    };

    this.tempMaps = {
        30: "1e",
        29: "1d",
        28: "1c",
        27: "1b",
        26: "1a",
        25: "19",
        24: "18",
        23: "17",
        22: "16",
        21: "15",
        20: "14",
        19: "13",
        18: "12",
        17: "11"
    };

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
        .setCharacteristic(Characteristic.Model, 'AcPartner');
    
    this.services.push(this.serviceInfo);

    this.discover();
}

XiaoMiAcPartner.prototype = {
    discover: function(){
        var accessory = this;
        var log = this.log;
        var token = this.token;

        log.debug('[XiaoMiAcParner][INFO] Discovering Mi AC Partner devices...');
        // Discover device in the network

        if (!this.ip) {

            log.debug('[XiaoMiAcParner][DEBUG] Using miio...');
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
    
                        log.debug('Discovered "%s" (ID: %s) on %s:%s.', reg.hostname, device.id, device.address, device.port);
                    }).catch(function(e) {
                        if (devices.length > 0) {
                            return;
                        }
                        
                        log.error('Device "%s" (ID: %s) register failed: %s (Maybe invalid token?)', reg.hostname, reg.id, e.message);
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
            log.debug('[XiaoMiAcParner][DEBUG] Using IP adrress...');
            accessory.device = "3";
            miio.device({ address: this.ip, token: this.token })
                .then(function(device){
                    accessory.device = device;
                    log.debug('[XiaoMiAcParner][INFO] Discovered "%s" (ID: %s) on %s:%s.', device.hostname, device.id, device.address, device.port);
                })
                .catch(console.error);
                
        }

    },

    getTargetHeatingCoolingState: function(callback) {
        callback(null, this.TargetHeatingCoolingState);
    },

    setTargetHeatingCoolingState: function(TargetHeatingCoolingState, callback, context) {
        if(context !== 'fromSetValue') {
            this.TargetHeatingCoolingState = TargetHeatingCoolingState;
            if (this.TargetHeatingCoolingState == Characteristic.TargetHeatingCoolingState.OFF) {
                this.log.debug('[XiaoMiAcParner][INFO] AC Power off');
            } else {
                this.log.debug('Set TargetHeatingCoolingState: ' + this.TargetHeatingCoolingState);
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
              }

            // Update current temperature
            this.acPartnerService
                .getCharacteristic(Characteristic.CurrentTemperature)
                .updateValue(parseFloat(TargetTemperature));

            this.log.debug('Set temperature: ' + TargetTemperature);
            this.SendCmd();
        }

        callback();
    },

    getCurrentTemperature: function(callback) {
        this.log("[XiaoMiAcParner][INFO] CurrentTemperature %s", this.TargetTemperature);
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
            this.log.error('[XiaoMiAcParner][WARN] Device not exists!');
            return;
        }

        if (customi = false) {
            if (!this.codeTpl) {
                this.log.error('[XiaoMiAcParner][WARN] Command code invalid, brand or preset_no not set right?')
                return;
            }
    
            var code = this.codeTpl
                    .replace("p", ((this.TargetHeatingCoolingState != Characteristic.TargetHeatingCoolingState.OFF) ? "1" : "0"))    // Power
                    .replace("m", ((this.TargetHeatingCoolingState != Characteristic.TargetHeatingCoolingState.OFF) ? this.stateMaps[this.TargetHeatingCoolingState] : "2"))
                    .replace("tt", this.tempMaps[this.TargetTemperature]);            
        }else{
            if (this.TargetHeatingCoolingState != Characteristic.TargetHeatingCoolingState.OFF) {
                if (this.TargetHeatingCoolingState == 1) {
                    if (!heatSignal[this.TargetTemperature]&&coolSignal[this.TargetTemperature] == "") {
                        this.log.error('[XiaoMiAcParner][WARN] Signal not define!');
                        return;
                    }
                    var code = heatSignal[this.TargetTemperature];
                }else{
                    if (!coolSignal[this.TargetTemperature]&&coolSignal[this.TargetTemperature] == "") {
                        this.log.error('[XiaoMiAcParner][WARN] Signal not define!');
                        return;
                    }
                    var code = coolSignal[this.TargetTemperature];
                }
            }else{
                var code = this.offSignal;
            }
        }

        this.log.debug("[XiaoMiAcParner][DEBUG]code: " + code);
        this.device.call('send_cmd', [code]);
    }
};
