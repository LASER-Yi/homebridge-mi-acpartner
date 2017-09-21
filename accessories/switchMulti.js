const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;

SwitchMultiAccessory = function(log, config, platform){
    this.log = log;
    this.platform = platform;
    this.config = config;

    Accessory = platform.Accessory;
    PlatformAccessory = platform.PlatformAccessory;
    Service = platform.Service;
    Characteristic = platform.Characteristic;
    UUIDGen = platform.UUIDGen;

    //config
    this.name = config['name'];
    this.sendInterval = config['interval'] || 1000;
    if(null != this.config['ip'] && null != this.config['token']){
        this.ip = this.config['ip'];
        this.token = this.config['token'];
        this.connectService = setInterval(this.search.bind(this),3500);
        setTimeout(this.refresh.bind(this),600000);
    }else if(this.platform.globalDevice){
        Promise.all([this.platform.globalDevice])
            .then(() =>{
                this.device = new Array();
                this.device = this.platform.device;
                this.log.debug("[%s]Global device connected",this.name);
            }).catch((err) =>{
                this.log.debug("[SWITCHMULTI_ERROR]Connect to global device fail! "+ err);
            })
    }else{
        this.log.error("[%s]Cannot find device infomation",this.name);
    }

    this.onState = Characteristic.On.NO;
    this.codeNu = 0;
    this.sendCode;

    if(!config.data || !config.data.on || !config.data.off){
        this.log.error("[SWITCHMULTI_ERROR]IR code no defined!");
    }else{
        this.log.debug("[%s]Code length: %s + %s",this.name, config.data.on.length, config.data.off.length);
    }

    this.services = [];

    platform.log.debug("[%s]Initializing switchMulti",this.name);

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

    platform.log.debug("[%s]Initialized successful",this.name);

}

SwitchMultiAccessory.prototype = {
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
                    this.platform.syncLock = false;
                }).catch((err) =>{
                    this.log.error("[SWITCHMULTI_ERROR]Cannot connect to AC Partner. " + err);
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
                this.log.error("[SWITCHMULTI_ERROR]Refresh fail. " + err);
                this.platform.syncLock = false;
            })

    },

    doRestThing: function(){
        //waiting
    },

    getServices: function(){
        return this.services;
    },

    setSwitchState: function(value, callback){
        if(!this.device || !this.device.call || !this.config.data.on || !this.config.data.off){
            return;
        }

        this.onState = value;
        this.sendCode = value ? this.config.data.on : this.config.data.off;

        this.codeInterval = setInterval(this.sendCmd.bind(this),this.sendInterval);
        callback();
    },

    sendCmd: function(){
        var code = this.sendCode[this.codeNu++];

        this.log.debug("[%s]Sending IR code #%s: %s",this.name,this.codeNu,code);
        let p1 = this.device.call('send_ir_code',[code])
            .then((ret) =>{
                this.log.debug("[%s]Return result: %s",this.name,ret);
            }).catch((err) =>{
                this.log.error("[SWITCHMULTI_ERROR]Send fail! " + err);
            });

        Promise.all([p1])
            .then(() =>{
                if (this.codeNu >= this.sendCode.length) {
                    clearInterval(this.codeInterval);
                    this.codeNu = 0;
                }
            })
    },

    getSwitchState: function(callback){
        callback(this.onState);
    }
}