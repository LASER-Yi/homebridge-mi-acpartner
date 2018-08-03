const base = require('./base');

/* Can construct from AC or become individe device */
class breaker extends base{
    constructor(config, platform, standalone) {
        super(config, platform);

        this.services = [];

        this.bState = false;

        if (standalone === true) {
            this.breakerInfo = new platform.Service.AccessoryInformation();
            this.breakerInfo
                .setCharacteristic(Characteristic.Manufacturer, 'XiaoMi')
                .setCharacteristic(Characteristic.Model, 'AC Partner Breaker')
                .setCharacteristic(Characteristic.SerialNumber, "Undefined");
            
            this.services.push(this.breakerInfo);
        } else {
            this.name += "_breaker";
        }

        this.breakerService = new platform.Service.Switch(this.name);
        this.breakerState = this.breakerService.getCharacteristic(platform.Characteristic.On)
            .on('set', this.setBreakerState.bind(this))
            .on('get', this.getBreakerState.bind(this))

        this.services.push(this.breakerService);
    }

    getBreakerState(callback) {
        if (!this.platform.syncLock._enterSyncState(() => {
            this.getBreakerState(callback);
        })) {
            return;
        }
        const p1 = this.platform.devices[this.deviceIndex].call("get_device_prop", ["lumi.0", "plug_state"])
            .then((data) => {
                if (data[0] !== undefined) {
                    let pstate = data[0];
                    if (pstate == 'off') {
                        callback(Characteristic.On.NO);
                        this.bState = false;
                    } else {
                        callback(Characteristic.On.YES);
                        this.bState = true;
                    }
                } else {
                    throw new Error("Breaker not exist!");
                }
            })
            .catch((err) => {
                this.log.error("[%s]Update breaker state failed! %s", this.name, err);
                callback(err);
            })
            .then(() => {
                this.platform.syncLock._exitSyncState();
            })
    }

    setBreakerState(value, callback) {
        if (!this.ReadyState) {
            callback(new Error("Waiting for device state, please try again after sync complete"));
            return;
        }
        if (!this.platform.syncLock._enterSyncState(() => {
            this.setBreakerState(value, callback);
        })) {
            return;
        }
        this.bState = !this.bState;
        let command = this.bState ? "on" : "off";

        const p1 = this.platform.devices[this.deviceIndex].call("toggle_plug", [command])
            .then((data) => {
                if (data[0] === "ok") {
                    this.log.debug("[DEBUG]Success")
                } else {
                    throw new Error("partner return " + data[0]);
                }
                callback();
            })
            .catch((err) => {
                this.log.error("[%s]Change breaker state failed! %s", this.name, err);
                callback(err);
            })
            .then(() => {
                this.platform.syncLock._exitSyncState();
            });
    }
}

module.exports = breaker;