const miio = require('miio')

require('./accessories/switch');
require('./accessories/climate');
require('./accessories/learnIR');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
    Accessory = homebridge.hap.Accessory;
    PlatformAccessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform('homebridge-mi-acpartner', 'XiaoMiAcPartner', XiaoMiAcPartner);
}

function XiaoMiAcPartner(log, config){
    if(null == config) {
        return;
    }

    //Init
    this.log = log;
    this.config = config;

    this.Accessory = Accessory;
    this.PlatformAccessory = PlatformAccessory;
    this.Service = Service;
    this.Characteristic = Characteristic;
    this.UUIDGen = UUIDGen;

    //miio device
    this.device;

    this.syncLock = false;//true: something connected; false: free to use
    
    if(null != this.config['ip'] && null != this.config['token']){
        this.syncLock = true;
        setTimeout(this.refresh.bind(this), 600000);
        this.globalDevice = !this.device && miio.device({ address: this.config['ip'], token: this.config['token'] })
            .then((device) =>{
                this.device = device;
                this.log("[GLOBAL]Discovered Device!");
                this.syncLock = false;
            }).catch((err) =>{
                this.log.error("[GLOBAL_ERROR]Cannot connect to AC Partner. " + err);
                this.syncLock = false;
            });

        this.log("[GLOBAL]Connecting...")
        Promise.all([this.globalDevice]);
    }

    this.log.info("[INFO]Plugin start successful");
}

XiaoMiAcPartner.prototype = {
    accessories: function(callback) {
        var myAccessories = [];
        var configAccs = this.config['accessories'];
        if(configAccs instanceof Array){
            for (var i = 0; i < configAccs.length; i++) {
                var configAcc = configAccs[i];
                if(null == configAcc['type'] || "" == configAcc['type'] || null == configAcc['name'] || "" == configAcc['name']){
                    continue;
                }
                
                //Register
                if(configAcc['type'] == "climate"){
                    this.log.info("[INFO]Register acc type:climate, name:%s",configAcc['name']);
                    var climateAcc = new ClimateAccessory(this.log, configAcc, this);
                    myAccessories.push(climateAcc);
                }else if(configAcc['type'] == "switch"){
                    this.log.info("[INFO]Register acc type:switch, name:%s",configAcc['name']);
                    var switchAcc = new SwitchAccessory(this.log, configAcc, this);
                    myAccessories.push(switchAcc);
                }else if(configAcc['type'] == "learnIR"){
                    this.log.info("[INFO]Register acc type:learnIR, name:%s",configAcc['name']);
                    var learnIRAcc = new LearnIRAccessory(this.log, configAcc, this);
                    myAccessories.push(learnIRAcc);
                }
            }
            this.log.info("[INFO]Register complete");
        }
        callback(myAccessories);
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
                this.log.error("[GLOBAL_ERROR]Refresh fail. " + err);
                this.syncLock = false;
            })
    }
}
