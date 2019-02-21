class Base {
    constructor(config, platform) {
        this.platform = platform;
        this.log = platform.log;
        this.config = config;
        this.name = config['name'];

        //Search device position
        this.deviceIndex = 0;
        if (config['deviceIp']) {
            this.deviceIndex = this._getDeviceIndex(platform.config.devices, this.config['deviceIp']);
        }

        this.services = [];

        //Device is not ready
        this.ReadyState = false;
        platform.startEvent.once(this.deviceIndex + "_ready", () => {
            this.log.debug("[%s]Ready", this.name);
            this._startAcc();
        })
    }

    _getDeviceIndex(devices, addr) {
        Object.getOwnPropertyNames(devices).forEach((device, index) => {
            if (device === addr) {
                return index
            }
        })
    }

    _startAcc() {
        this.ReadyState = true;
    }
    getServices() {
        return this.services;
    }
    identify(callback) {
        this.log("[INFO]%s indetify!!!", this.name);
        callback();
    }
}

module.exports = Base;