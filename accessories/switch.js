//require('./Base');

//const inherits = require('util').inherits;
const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;

SwitchAccessory = function(log, config, platform){
    //this.init(platform, config);
    this.log = log;
    this.platform = platform;
    this.config = config;

    Accessory = platform.Accessory;
    PlatformAccessory = platform.PlatformAccessory;
    Service = platform.Service;
    Characteristic = platform.Characteristic;
    UUIDGen = platform.UUIDGen;

    this.name = config['name'];
    this.onState = Characteristic.On.NO;

    if(!config.data || !config.data.on || !config.data.off){
        this.log.error("[XiaoMiAcPartnerIR][ERROR]IR code no defined!");
    }else{
        this.onCode = config.data.on;
        this.offCode = config.data.off;
    }

    var that = this;

    if(null != this.config['ip'] && null != this.config['token']){
        miio.device({ address: this.config['ip'], token: this.config['token'] })
            .then(function(device){
                that.device = device;
                that.log("[XiaoMiAcPartnerIR][%s]Discovered Device!",this.name);
            }).catch(function(err){
                that.log.error("[XiaoMiAcPartnerIR][ERROR]Cannot connect to AC Partner. " + err);
            })
    }else if(platform.device){
        this.device = platform.device;
    }else{
        that.log.error("[XiaoMiAcPartnerIR][%s]Cannot find device infomation",this.name);
    }

    this.services = [];

    this.platform.log.debug("[XiaoMiAcPartnerIR][%s]Initializing switch acc",this.name);

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

    this.platform.log.debug("[XiaoMiAcPartnerIR][%s]Initialized successful",this.name);
}

SwitchAccessory.prototype = {
    getServices: function(){
        return this.services;
    },

    setSwitchState: function(value, callback){
        if(!this.device){
            return;
        }

        if(value == Characteristic.On.NO){
            this.device.call('send_ir_code',this.offCode)
                .then(function(ret){
                    that.log.debug("[XiaoMiAcPartnerIR][%s]Return result: %s",this.name,ret);
                }).catch(function(err){
                    that.log.error("[XiaoMiAcPartnerIR][ERROR]Send code fail! " + err);
                });
        }else{
            this.device.call('send_ir_code',this.onCode)
            .then(function(ret){
                that.log.debug("[XiaoMiAcPartnerIR][%s]Return result: %s",this.name,ret);
            }).catch(function(err){
                that.log.error("[XiaoMiAcPartnerIR][ERROR]Send code fail! " + err);
            });
        }
        this.onState = value;
        callback();
    },

    getSwitchState: function(callback){
        callback(this.onState);
    }
}