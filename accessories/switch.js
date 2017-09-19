//require('./base');

//const inherits = require('util').inherits;
const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;

SwitchAccessory = function(log, config, platform){
    this.log = log;
    this.platform = platform;
    this.config = config;

    Accessory = platform.Accessory;
    PlatformAccessory = platform.PlatformAccessory;
    Service = platform.Service;
    Characteristic = platform.Characteristic;
    UUIDGen = platform.UUIDGen;
    this.name = config['name'];

    if(null != this.config['ip'] && null != this.config['token']){
        this.ip = this.config['ip'];
        this.token = this.config['token'];
    }else if(this.platform.isGlobal){
        this.ip = this.platform.ip;
        this.token = this.platform.token;
    }else{
        this.log.error("[XiaoMiAcPartner][%s]Cannot find device infomation",this.name);
    }

    this.onState = Characteristic.On.NO;

    if(!config.data || !config.data.on || !config.data.off){
        this.log.error("[XiaoMiAcPartner][ERROR]IR code no defined!");
    }else{
        this.onCode = config.data.on;
        this.offCode = config.data.off;
    }

    this.services = [];

    platform.log.debug("[XiaoMiAcPartner][%s]Initializing switch acc",this.name);

    this.infoService = new Service.AccessoryInformation();
    this.infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "AC Partner IR Switch")
        .setCharacteristic(Characteristic.SerialNumber, "Undefined");
    this.services.push(this.infoService);

    this.switchService = new Service.Switch(this.name);

    this.switchService
        .getCharacteristic(Characteristic.On)
        .on('set', this.setSwitchState.bind(this))
        .on('get', this.getSwitchState.bind(this));
    this.services.push(this.switchService);

    platform.log.debug("[XiaoMiAcPartner][%s]Initialized successful",this.name);

    this.doRestThing();
}
//inherits(SwitchAccessory, Base);

SwitchAccessory.prototype = {
    discover: function(){
        var that = this;
        
        this.log.debug("[XiaoMiAcPartner][%s]Discovering...",this.name);
        miio.device({ address: this.ip, token: this.token })
        .then(function(device){
            that.device = device;
            that.log("[XiaoMiAcPartner][%s]Discovered Device!",that.name);
        }).catch(function(err){
            that.log.error("[XiaoMiAcPartner][ERROR]Cannot connect to AC Partner. " + err);
        })
    },

    doRestThing: function(){
        var that = this;
        
        this.discover();                        
        setInterval(function(){
            that.discover();
        }, 300000)
    },

    getServices: function(){
        return this.services;
    },

    setSwitchState: function(value, callback){
        if(!this.device || !this.device.call){
            //return;
        }

        var that = this;

        this.onState = value;

        this.log.debug("[XiaoMiAcPartner][%s]Sending IR code: %s",this.name,value ? this.onCode : this.offCode);
        this.device.call('send_ir_code',[value ? this.onCode : this.offCode])
            .then(function(ret){
                that.log.debug("[XiaoMiAcPartner][%s]Return result: %s",this.name,ret);
            }).catch(function(err){
                that.log.error("[XiaoMiAcPartner][ERROR]Send code fail! " + err);
            });

        callback();
    },

    getSwitchState: function(callback){
        callback(this.onState);
    }
}