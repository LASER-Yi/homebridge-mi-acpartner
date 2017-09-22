const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;

SwitchRepeatAccessory = function(log, config, platform){
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
        setTimeout(this.refresh.bind(this),600000);
    }else if(this.platform.globalDevice){
        Promise.all([this.platform.globalDevice])
            .then(() =>{
                this.device = new Array();
                this.device = this.platform.device;
                this.log.debug("[%s]Global device connected",this.name);
            }).catch((err) =>{
                this.log.debug("[SWITCHREPEAT_ERROR]Connect to global device fail! "+ err);
            })
    }else{
        this.log.error("[%s]Cannot find device infomation",this.name);
    }

    if(!config.data){
        this.log.error("[SWITCHREPEAT_ERROR]IR code no defined!");
    }else{
        this.code = config.data;
    }

    this.services = [];

    platform.log.debug("[%s]Initializing switchRepeat",this.name);

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

SwitchRepeatAccessory.prototype = {
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
                    this.log.error("[SWITCHREPEAT_ERROR]Cannot connect to AC Partner. " + err);
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
                this.log.error("[SWITCHREPEAT_ERROR]Refresh fail. " + err);
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
        if(!this.device || !this.device.call){
            return;
        }

        this.log.debug("[%s]Sending IR code: %s",this.name,this.code);
        this.device.call('send_ir_code',[this.code])
            .then((ret) =>{
                this.log.debug("[%s]Return result: %s",this.name,ret);
            }).catch((err) =>{
                this.log.error("[SWITCHREPEAT_ERROR]Send fail! " + err);
            });
        callback();
        this.switchService.getCharacteristic(Characteristic.On).updateValue(false);
    },

    getSwitchState: function(callback){
        callback(false);
    }
}