const events = require('events');
const connectUtil = require('./lib/connectUtil');
const packageFile = require('./package.json');

const ClimateAccessory = require('./accessories/climate');
const SwitchAccessory = require('./accessories/switch');
const SwitchRepeatAccessory = require('./accessories/switchRepeat');
const LearnIRAccessory = require('./accessories/learnIR');
const HeaterCoolerAccessory = require('./accessories/heaterCooler');

let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
    PlatformAccessory = homebridge.platformAccessory;
    Accessory = homebridge.hap.Accessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform('homebridge-mi-acpartner', 'XiaoMiAcPartner', XiaoMiAcPartner, true);
}

function XiaoMiAcPartner(log, config, api) {
    if (config === null) return;

    this.log = log;
    this.config = config;

    this.PlatformAccessory = PlatformAccessory;
    this.Accessory = Accessory;
    this.Service = Service;
    this.Characteristic = Characteristic;
    this.UUIDGen = UUIDGen;

    //Miio devices
    this.devices = [];

    //Config Reader
    this.refreshInterval = config["refreshInterval"] || 10 * 60 * 1000;
    if (!this.config['accessories']) {
        this.log.error("[ERROR]'accessories' not defined! Please check your 'config.json' file.");
        return;
    }

    //Global command syncLock
    this.syncCounter = 0;
    this.syncLockEvent = new events.EventEmitter();

    //Connection util init;
    if (config.devices) {
        this.conUtil = new connectUtil(config.devices, this);
        setInterval((() => {
            this.conUtil.refresh();
        }), this.refreshInterval);
    } else {
        this.log.error("[ERROR]'devices' not defined! Please check your 'config.json' file.");
        return;
    }

    if (api) {
        this.api = api;
    }
    this.log.info("--------------------------------------------------------------");
    this.log.info("Initialing XiaoMiAcPartner...");
    this.log.info("Current version -> %s", packageFile.version);
    this.log.info("GitHub: https://github.com/LASER-Yi/homebridge-mi-acpartner");
    this.log.info("QQ Group: 107927710");
    this.log.info("--------------------------------------------------------------");
}

XiaoMiAcPartner.prototype = {
    accessories: function (callback) {
        /**Start register accessories */
        let accessories = [];

        this.config['accessories'].forEach(element => {
            if (undefined != element['type'] || undefined != element['name']) {
                //Register
                this.log("[INFO]Register %s -> type:%s", element['name'], element['type']);
                switch (element['type']) {
                    case "switch":
                        accessories.push(new SwitchAccessory(element, this));
                        break;
                    case "learnIR":
                        accessories.push(new LearnIRAccessory(element, this));
                        break;
                    case "switchRepeat":
                        accessories.push(new SwitchRepeatAccessory(element, this));
                        break;
                    case "heaterCooler":
                        accessories.push(new HeaterCoolerAccessory(element, this));
                        break;
                    case "climate":
                        accessories.push(new ClimateAccessory(element, this));
                        break;
                }
            }
        });
        this.log("[INFO]Register complete");
        callback(accessories);
    },
    _enterSyncState: function () {
        if (this.syncCounter >= 5) {
            return false;
        } else {
            this.syncCounter++;
            //this.log.debug("[DEBUG]Enter SyncState #%s", this.syncCounter);
            return true;
        }
    },
    _exitSyncState: function () {
        this.syncLockEvent.emit("lockDrop");
        //this.log.debug("[DEBUG]Exit SyncState #%s", this.syncCounter);
        if (this.syncCounter > 0) {
            this.syncCounter--;
        } else {
            this.syncCounter = 0;
        }
    }
}