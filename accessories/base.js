// Base
const miio = require('miio');

var Service, Characteristic, Accessory;

Base = function (log, config, platform) {
    this.log = log;
    this.platform = platform;
    this.config = config;
    this.connectCounter = 0;

    Accessory = platform.Accessory;
    Service = platform.Service;
    Characteristic = platform.Characteristic;
}

Base.prototype = {
    doRestThing: function () {
        /*Try to connect to device */
        if (null != this.config['ip'] && null != this.config['token']) {
            this.ip = this.config['ip'];
            this.token = this.config['token'];
            this.connectCounter = 0;
            this.connectService = setInterval(this.search.bind(this), 3000);
            /*Using Local device, refresh connection every 10min*/
            setTimeout(this.refresh.bind(this), 600000);
        } else if (this.platform.globalDevice) {
            this.log.debug("[%s]Waiting for global device", this.name);
            Promise.all([this.platform.globalDevice])
                .then(() => {
                    if (this.platform.device !== undefined) {
                        this.device = new Array();
                        this.device = this.platform.device;
                        this.log.debug("[%s]Global device connected", this.name);
                    }
                });
        } else {
            this.log.error("[%s]Cannot find ip or token, please check your config.json file", this.name);
        }
    },
    search: function () {
        if (this.platform.syncLock == true) return;
        this.platform.syncLock = true;

        this.log.debug("[%s]Connecting...", this.name);
        miio.device({
                address: this.ip,
                token: this.token
            })
            .then((device) => {
                this.device = device;
                this.log.info("[%s]Device Connected!", this.name);
                clearInterval(this.connectService);
                this.platform.syncLock = false;
            }).catch((err) => {
                this.connectCounter++;
                if (this.connectCounter > 3) {
                    clearInterval(this.connectService);
                    this.log.error("[ERROR]Cannot connect to AC Partner after 3 tries, please check your device.");
                } else {
                    this.log.error("[ERROR]Cannot connect to AC Partner, still trying to connect.");
                    this.log.error("[ERROR]Add '-D' parameter to show more information.")
                }
                this.log.debug(err);
                this.platform.syncLock = false;
            });
    },
    refresh: function () {
        if (this.platform.syncLock == true) return;
        this.platform.syncLock = true;

        this.log.debug("[%s]Refreshing connection...", this.name);
        this.connectCounter = 0;
        miio.device({
                address: this.ip,
                token: this.token
            })
            .then((device) => {
                this.device = device;
                this.log.debug("[%s]Connection refreshed.", this.name);
                this.platform.syncLock = false;
            }).catch((err) => {
                this.log.error("[ERROR]Cannot connect to AC Partner, trying to connect after 600000ms.");
                this.log.error("[ERROR]Add '-D' parameter to show more information.")
                this.log.debug(err);
                this.platform.syncLock = false;
            })

    },
    //Return this service to Homebridge
    getServices: function () {
        return this.service;
    },
    identify: function (callback) {
        callback();
    },
}