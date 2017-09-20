const miio = require('miio')

require('./accessories/switch');
require('./accessories/climate');

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

    this.device;

    var that = this;
    
    if(null != this.config['ip'] && null != this.config['token']){
        setTimeout(this.discover.bind(this), 300000);
        this.globalDevice = !this.device && miio.device({ address: this.config['ip'], token: this.config['token'] })
            .then((device) =>{
                this.device = device;
                this.log("[GLOBAL]Discovered Device!");
            }).catch((err) =>{
                this.log.error("[GLOBAL_ERROR]Cannot connect to AC Partner. " + err);
            })

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
                }else{
                }
            }
            this.log.info("[INFO]Register complete");
        }
        callback(myAccessories);
    },

    discover: function(){
        var that = this;
        
        this.log.debug("[GLOBAL]Discovering...");
        let p1 = miio.device({ address: this.config['ip'], token: this.config['token'] })
            .then(function(device){
                that.device = device;
                that.log("[GLOBAL]Discovered Device!");
            }).catch(function(err){
                that.log.error("[GLOBAL_ERROR]Cannot connect to AC Partner. " + err);
            })

        Promise.all([p1])
            .catch(err => this.log.error("[GLOBAL_ERROR]Rediscover fail,error: " + err))
            .then(() => setTimeout(this.discover.bind(this), 3000));
    }
}
