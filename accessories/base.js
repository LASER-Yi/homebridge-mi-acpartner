class Base {
    constructor(config, platform) {
        this.platform = platform;
        this.log = platform.log;
        this.config = config;
        this.name = config['name'];

        //Search device position
        this.deviceIndex = 0;
        if (config['deviceIp']) {
            let index = 0;
            for (var elem in platform.config.devices) {
                if (elem == config['deviceIp']) {
                    this.deviceIndex = index;
                    break;
                }
                index++;
            }
        }

        //Device is not ready
        this.ReadyState = false;
        platform.startEvent.once(this.deviceIndex, () => {
            this.log.debug("[%s]Ready", this.name);
            this._startAcc();
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