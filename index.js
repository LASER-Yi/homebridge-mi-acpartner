const events = require('events');
const connectUtil = require('./lib/connectUtil');
const syncLockUtil = require('./lib/syncLockUtil');
const packageFile = require('./package.json');

const fs_Accessory = require('./accessories');

var PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
    PlatformAccessory = homebridge.platformAccessory;
    Accessory = homebridge.hap.Accessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform('homebridge-mi-acpartner', 'XiaoMiAcPartner', XiaoMiAcPartner, true);
}

class XiaoMiAcPartner{
    constructor(log, config, api) {
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

        //Config
        this.refreshInterval = (typeof config["refreshInterval"]) == "number" ? config["refreshInterval"] : 1 * 30 * 1000;

        if (!config['accessories']) {
            this.log.error("[ERROR]'accessories' not defined! Please check your 'config.json' file.");
        }
        if (!config.devices) {
            this.log.error("[ERROR]'devices' not defined! Please check your 'config.json' file.");
            return;
        }

        this.welcomeInfo();

        //New syncLock
        this.syncLock = new syncLockUtil(this);

        //Accessory EventEmitter
        this.startEvent = new events.EventEmitter();

        //Connect devices
        this.conUtil = new connectUtil(config.devices, this);
        setInterval((() => {
            this.conUtil.refresh();
        }), this.refreshInterval);

        if (api) {
            this.api = api;
            this.api.on("didFinishLaunching", () => {
            })
        } else {
            this.log.error("[ERROR]Homebridge's version is too old, please upgrade it!");
        }
    }

    welcomeInfo() {
        this.log.info("----------------------------------------------------");
        this.log.info("XiaoMiAcPartner By LASER-Yi");
        this.log.info("Current version: %s", packageFile.version);
        this.log.info("GitHub: https://github.com/LASER-Yi/homebridge-mi-acpartner");
        this.log.info("QQ Group: 107927710");
        this.log.info("----------------------------------------------------");
    }

    accessories(callback) {
        //Start register accessories
        var accessories = [];

        this.config['accessories'].forEach(element => {
            if ((typeof element['type']) == "string" && (typeof element['name']) == "string") {
                //Register
                this.log("[INIT]%s -> Type: %s", element['name'], element['type']);
                switch (element['type']) {
                    case "switch":
                        accessories.push(new fs_Accessory.SwitchAccessory(element, this));
                        break;
                    case "learnIR":
                        accessories.push(new fs_Accessory.LearnIRAccessory(element, this));
                        break;
                    case "switchRepeat":
                        accessories.push(new fs_Accessory.SwitchRepeatAccessory(element, this));
                        break;
                    case "heaterCooler":
                        accessories.push(new fs_Accessory.HeaterCoolerAccessory(element, this));
                        break;
                    case "climate":
                        accessories.push(new fs_Accessory.ClimateAccessory(element, this));
                        break;
                    case "breaker":
                        accessories.push(new fs_Accessory.BreakerAccessory(element, this, true));
                    default:
                        this.log.warn("[WARN]Wrong Type -> %s", element['type']);
                }
            }
        });
        callback(accessories);
    }
}