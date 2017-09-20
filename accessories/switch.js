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
    var that = this;

    if(null != this.config['ip'] && null != this.config['token']){
        this.ip = this.config['ip'];
        this.token = this.config['token'];
        this.discover();
    }else if(this.platform.globalDevice){
        Promise.all([this.platform.globalDevice])
            .then(() => {
                that.device = that.platform.device;
                that.log.debug("[XiaoMiAcPartner][%s]Got global device information",this.name)
            })
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

SwitchAccessory.prototype = {
    discover: function(){
        var that = this;
        
        this.log.debug("[XiaoMiAcPartner][%s]Discovering...",this.name);
        let p1 =  miio.device({ address: this.ip, token: this.token })
            .then(function(device){
                that.device = device;
                that.log("[XiaoMiAcPartner][%s]Discovered Device!",that.name);
            }).catch(function(err){
                that.log.error("[XiaoMiAcPartner][ERROR]Cannot connect to AC Partner. " + err);
            })

        Promise.all([p1])
            .catch(err => this.log.error("[XiaoMiAcPartner][ERROR]Rediscover fail,error: " + err))
            .then(() => setTimeout(this.discover.bind(this), 300000));
    },

    doRestThing: function(){
        var that = this;
        
    },

    getServices: function(){
        return this.services;
    },

    setSwitchState: function(value, callback){
        if(!this.device || !this.device.call || !this.onCode || !this.offCode){
            return;
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