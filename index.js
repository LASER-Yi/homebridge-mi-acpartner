const miio = require('miio')
const events = require('events');

const connectUtil = require('./lib/connectUtil');

require('./accessories/climate');
const SwitchAccessory = require('./accessories/switch');
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
        /**Start register accessories */
        var accessories = [];

        this.config['accessories'].forEach(element => {
            if (undefined != element['type'] || undefined != element['name']) {
                //Register
                this.log("[INFO]Register accessory type:%s, name:%s", element['type'], element['name']);
                switch (element['type']) {
                    case "switch":
                        accessories.push(new SwitchAccessory(element, this));
                        break;
                    case "switchRepeat":
                        var swRepAcc = new SwitchRepeatAccessory(this.log, element, this);
                        accessories.push(swRepAcc);
                        break;
                    case "learnIR":
                        var learnIRAcc = new LearnIRAccessory(this.log, element, this);
                        accessories.push(learnIRAcc);
                        break;
                    case "switchMulti":
                        var swMultiAcc = new SwitchMultiAccessory(this.log, element, this);
                        accessories.push(swMultiAcc);
                        break;
                    case "heaterCooler":
                        var hcAcc = new HeaterCoolerAccessory(this.log, element, this);
                        accessories.push(hcAcc);
                        break;
                    default:
                        /* Define as climate */
                        var climateAcc = new ClimateAccessory(this.log, element, this);
                        accessories.push(climateAcc);
                        break;
                }
            }
            this.log("[INFO]Register complete");
        });
        callback(accessories);
    },
    _enterSyncState: function () {
        if (syncCounter >= 2) {
            return false;
        } else if (this.commSyncLock == false) {
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