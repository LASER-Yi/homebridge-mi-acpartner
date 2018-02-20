const miio = require('miio')
const events = require('events');

const connectUtil = require('./lib/connectUtil');

require('./accessories/climate');
require('./accessories/switch');
require('./accessories/switchRepeat');
require('./accessories/learnIR');
require('./accessories/switchMulti');
require('./accessories/heaterCooler');

var PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
    PlatformAccessory = homebridge.platformAccessory;
    Accessory = homebridge.hap.Accessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform('homebridge-mi-acpartner', 'XiaoMiAcPartner', XiaoMiAcPartner, true);
}

function XiaoMiAcPartner(log, config, api) {
    if (null == config) return;

    this.log = log;
    this.config = config;

    this.PlatformAccessory = PlatformAccessory;
    this.Accessory = Accessory;
    this.Service = Service;
    this.Characteristic = Characteristic;
    this.UUIDGen = UUIDGen;

    //Config Reader
    this.refreshInterval = config.refreshInterval || 10 * 60 * 1000;
    if (!this.config['accessories']) {
        this.log.error("[ERROR]'accessories' not defined! Please check your 'config.json' file.");
        return;
    }

    //Connection util init;
    if (config.devices) {
        this.conUtil = new connectUtil(config.devices, log);
        setInterval((() => {
            this.conUtil.refresh();
        }), this.refreshInterval);
    } else {
        this.log.error("[ERROR]'devices' not defined! Please check your 'config.json' file.");
        return;
    }

    //Global command syncLock
    this.commSyncLock = false;
    this.syncLockEvent = new events.EventEmitter();
    this.syncCounter = 0;

    if (api) {
        this.api = api;
    }
}

XiaoMiAcPartner.prototype = {
    accessories: function (callback) {
        var accessories = [];
        var GlobalConfig = this.config['accessories'];
        if (GlobalConfig instanceof Array) {
            for (var i = 0; i < GlobalConfig.length; i++) {
                var configAcc = GlobalConfig[i];
                if (null == configAcc['type'] || "" == configAcc['type'] || null == configAcc['name'] || "" == configAcc['name']) {
                    continue;
                }
                //Register
                switch (configAcc['type']) {
                    case "switch":
                        this.log.info("[INFO]Register acc type:switch, name:%s", configAcc['name']);
                        var switchAcc = new SwitchAccessory(this.log, configAcc, this);
                        accessories.push(switchAcc);
                        break;
                    case "switchRepeat":
                        this.log.info("[INFO]Register acc type:switchRepeat, name:%s", configAcc['name']);
                        var swRepAcc = new SwitchRepeatAccessory(this.log, configAcc, this);
                        accessories.push(swRepAcc);
                        break;
                    case "learnIR":
                        this.log.info("[INFO]Register acc type:learnIR, name:%s", configAcc['name']);
                        var learnIRAcc = new LearnIRAccessory(this.log, configAcc, this);
                        accessories.push(learnIRAcc);
                        break;
                    case "switchMulti":
                        this.log.info("[INFO]Register acc type:switchMulti, name:%s", configAcc['name']);
                        var swMultiAcc = new SwitchMultiAccessory(this.log, configAcc, this);
                        accessories.push(swMultiAcc);
                        break;
                    case "heaterCooler":
                        this.log.info("[INFO]Register acc type:HeaterCooler, name:%s", configAcc['name']);
                        var hcAcc = new HeaterCoolerAccessory(this.log, configAcc, this);
                        accessories.push(hcAcc);
                        break;
                    default:
                        /* Define as climate */    
                        this.log.info("[INFO]Register acc type:climate, name:%s", configAcc['name']);
                        var climateAcc = new ClimateAccessory(this.log, configAcc, this);
                        accessories.push(climateAcc);
                        break;
                }
            }
            this.log("[INFO]Register complete");
        }
        callback(accessories);
    },
    _enterSyncState: function () {
        if (syncCounter >= 2) {
            return false;
        } else if(this.commSyncLock == false){
            this.commSyncLock = true;
            syncCounter++;
            return true;
        }
    },
    _exitSyncState: function () {
        this.commSyncLock = false;
        this.syncLockEvent.emit("lockDrop");
        if (syncCounter > 0) {
            syncCounter--;
        } else {
            syncCounter = 0;
        }
    }
}