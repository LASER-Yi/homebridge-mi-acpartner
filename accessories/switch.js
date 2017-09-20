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
        this.connectService = setInterval(this.search.bind(this),3500);
    }else if(this.platform.globalDevice){
        Promise.all([this.platform.globalDevice])
            .then(() =>{
                this.device = new Array();
                this.device = this.platform.device;
                this.log.debug("[%s]Global device connected",this.name);
            }).catch((err) =>{
                this.log.debug("[SWITCH_ERROR]Connect to global device fail! "+ err);
            })
    }else{
        this.log.error("[%s]Cannot find device infomation",this.name);
    }

    this.onState = Characteristic.On.NO;

    if(!config.data || !config.data.on || !config.data.off){
        this.log.error("[SWITCH_ERROR]IR code no defined!");
    }else{
        this.onCode = config.data.on;
        this.offCode = config.data.off;
    }

    this.services = [];

    platform.log.debug("[%s]Initializing switch",this.name);

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

SwitchAccessory.prototype = {
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
                    this.log.error("[SWITCH_ERROR]Cannot connect to AC Partner. " + err);
                    this.platform.syncLock = false;
                });
        }
    },

    discover: function(){

        this.log.debug("[%s]Discovering...",this.name);
        let p1 =  miio.device({ address: this.ip, token: this.token })
            .then((device) =>{
                this.device = device;
                this.log("[%s]Discovered Device!",that.name);
            }).catch(function(err){
                this.log.error("[SWITCH_ERROR]Cannot connect to AC Partner. " + err);
            })

        Promise.all([p1])
            .catch(err => this.log.error("[SWITCH_ERROR]Discover fail,error: " + err))
            .then(() => setTimeout(this.discover.bind(this), 300000));

    },

    doRestThing: function(){
        //waiting
    },

    getServices: function(){
        return this.services;
    },

    setSwitchState: function(value, callback){
        if(!this.device || !this.device.call || !this.onCode || !this.offCode){
            return;
        }

        this.onState = value;

        this.log.debug("[%s]Sending IR code: %s",this.name,value ? this.onCode : this.offCode);
        this.device.call('send_ir_code',[value ? this.onCode : this.offCode])
            .then((ret) =>{
                this.log.debug("[%s]Return result: %s",this.name,ret);
            }).catch((err) =>{
                this.log.error("[SWITCH_ERROR]Send fail! " + err);
            });

        callback();
    },

    getSwitchState: function(callback){
        callback(this.onState);
    }
}