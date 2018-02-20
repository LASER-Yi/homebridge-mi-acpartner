
var Service, Characteristic, Accessory;

class Base{
    constructor(config, platform) {
        this.init(config,platform);
    }

    init(config, platform) {
        this.platform = platform;
        this.log = platform.log;
        this.config = config;
        this.name = config['name'];
        this.deviceIndex = this.config['deviceIndex'] || 0;
    }
    getServices() {
        return this.services;
    }
    identify(callback) {
        callback();
    }
}

module.exports = Base;