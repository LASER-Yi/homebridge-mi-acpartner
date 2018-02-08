const miio = require('miio')

require('./accessories/climate');
require('./accessories/switch');
require('./accessories/switchRepeat');
require('./accessories/learnIR');
require('./accessories/switchMulti');
require('./accessories/heaterCooler');

var PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
    PlatformAccessory = homebridge.platformAccessory;
    Accessory = homebridge.hap.Accessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform('homebridge-mi-acpartner', 'XiaoMiAcPartner', XiaoMiAcPartner, true);
}

function XiaoMiAcPartner(log, config, api){
    if(null == config) {
        return;
    }
    //Init
    this.log = log;
    this.config = config;
    
    this.PlatformAccessory = PlatformAccessory;
    this.Accessory = Accessory;
    this.Service = Service;
    this.Characteristic = Characteristic;
    this.UUIDGen = UUIDGen;

    //miio device
    this.device;

    this.syncLock = false;//true: something using; false: free to use

    if (api) {
        this.api = api;
    }

    /*Try to connect to device */
    if(null != this.config['ip'] && null != this.config['token']){
        this.syncLock = true;
        setTimeout(this.refresh.bind(this), 600000);
        this.globalDevice = !this.device && miio.device({ address: this.config['ip'], token: this.config['token'] })
            .then((device) =>{
                this.device = device;
                this.log("[GLOBAL]Connected!");
                this.syncLock = false;
            }).catch((err) =>{
                this.log.error("[GLOBAL]Cannot connect to AC Partner. " + err);
                this.syncLock = false;
            });

        this.log("[GLOBAL]Connecting...")
        Promise.all([this.globalDevice]);
    }
}

XiaoMiAcPartner.prototype = {
    accessories: function(callback) {
        var accessories = [];
        var GlobalConfig = this.config['accessories'];
        if(GlobalConfig instanceof Array){
            for (var i = 0; i < GlobalConfig.length; i++) {
                var configAcc = GlobalConfig[i];
                if(null == configAcc['type'] || "" == configAcc['type'] || null == configAcc['name'] || "" == configAcc['name']){
                    continue;
                }
                //Register
                switch (configAcc['type']) {
                    case "climate":
                        this.log.info("[INFO]Register acc type:climate, name:%s",configAcc['name']);
                        var climateAcc = new ClimateAccessory(this.log, configAcc, this);
                        accessories.push(climateAcc);
                        break;
                    case "switch":
                        this.log.info("[INFO]Register acc type:switch, name:%s",configAcc['name']);
                        var switchAcc = new SwitchAccessory(this.log, configAcc, this);
                        accessories.push(switchAcc);
                        break;
                    case "switchRepeat":
                        this.log.info("[INFO]Register acc type:switchRepeat, name:%s",configAcc['name']);
                        var swRepAcc = new SwitchRepeatAccessory(this.log, configAcc, this);
                        accessories.push(swRepAcc);
                        break;
                    case "learnIR":
                        this.log.info("[INFO]Register acc type:learnIR, name:%s",configAcc['name']);
                        var learnIRAcc = new LearnIRAccessory(this.log, configAcc, this);
                        accessories.push(learnIRAcc);
                        break;
                    case "switchMulti":
                        this.log.info("[INFO]Register acc type:switchMulti, name:%s",configAcc['name']);
                        var swMultiAcc = new SwitchMultiAccessory(this.log, configAcc, this);
                        accessories.push(swMultiAcc);
                        break;
                    case "heaterCooler":
                        this.log.info("[INFO]Register acc type:HeaterCooler, name:%s",configAcc['name']);
                        var hcAcc = new HeaterCoolerAccessory(this.log, configAcc, this);
                        accessories.push(hcAcc);
                        break;
                }
            }
            this.log("[INFO]Register complete");
        }
        callback(accessories);
    },
    refresh: function(){
        if (this.syncLock == true) {
            return;
        }
        this.syncLock = true;
        
        this.log.debug("[GLOBAL]Refreshing...");
        miio.device({ address: this.config['ip'], token: this.config['token'] })
            .then((device) =>{
                this.device = device;
                this.log("[GLOBAL]Device refreshed");
                this.syncLock = false;
            }).catch((err) =>{
                this.log.error("[GLOBAL]Refresh fail. " + err);
                this.syncLock = false;
            })
    }
}
