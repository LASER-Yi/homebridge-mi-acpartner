const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;

LearnIRAccessory = function(log, config, platform){
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
                this.log.debug("[LEARN_ERROR]Connect to global device fail! "+ err);
            })
    }else{
        this.log.error("[%s]Cannot find device infomation",this.name);
    }

    //State
    this.onState = Characteristic.On.NO;
    this.staLearn = false;
    this.LastLearn = null;

    this.services = [];

    platform.log.debug("[%s]Initializing learnIR",this.name);

    this.infoService = new Service.AccessoryInformation();
    this.infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "AC Partner Learn Switch")
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

LearnIRAccessory.prototype = {
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
                    this.log.error("[LEARN_ERROR]Cannot connect to AC Partner. " + err);
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
                this.log.error("[LEARN_ERROR]Refresh fail. " + err);
                this.platform.syncLock = false;
            })

    },

    doRestThing: function(){
        //waiting
    },

    getServices: function(){
        return this.services;
    },

    autoClo: function(){
        this.log.info("[%s]Auto Stop Learning...",this.name);
        clearInterval(this.autoStop);
        this.onState = false;
        this.switchService.getCharacteristic(Characteristic.On).updateValue(false);
    },

    showIRCode: function(){
        let p1 = this.device.call('get_ir_learn_result',[])
            .then((ret) =>{
                if(ret[0] != '(null)' && ret[0] != this.LastLearn){
                    this.LastLearn = ret[0];
                    this.log.info("[%s]IR Code: %s",this.name,ret[0]);
                }
            }).catch((err) =>this.log.error("[LEARN_ERROR]Return error! " + err));

        Promise.all([p1])
            .then(() =>{
                if (this.onState) {
                    this.showIRCode();
                }
            })
    },

    setSwitchState: function(value, callback){
        if(!this.device || !this.device.call){
            return;
        }

        this.onState = value;
        if (value) {
            this.device.call('start_ir_learn',[30])
                .then(() =>{
                    this.log.info("[%s]Start Learning...Auto stop after 30 seconds",this.name);
                    this.showIRCode();
                    this.autoStop = setInterval(this.autoClo.bind(this),30000);
                    callback();
                }).catch((err) =>this.log.error("[LEARN_ERROR]Start fail! " + err));
        }else{
            this.device.call('end_ir_learn',[])
                .then(() =>{
                    this.log.info("[%s]Stop Learning...",this.name);
                    clearInterval(this.autoStop);
                    callback();
                }).catch((err) =>this.log.error("[LEARN_ERROR]End fail! " + err))
        }
    },

    getSwitchState: function(callback){
        callback(this.onState);
    }
}