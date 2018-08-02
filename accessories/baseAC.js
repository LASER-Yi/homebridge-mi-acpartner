const base = require('./base');

const presetUtil = require("../lib/presetUtil");

class baseAC extends base {

    constructor(config, platform) {
        super(config, platform);

        this.lastSensorState = null;
        this.lastPartnerState = null;

        this.services = [];

        //Config
        this.maxTemp = parseInt(config.maxTemp, 10) || 30;
        this.minTemp = parseInt(config.minTemp, 10) || 17;
        this.syncInterval = config.syncInterval !== undefined ? parseInt(config.syncInterval, 10) : 60 * 1000;
        this.autoStart = config.autoStart || "cool";
        this.outerSensor = config.sensorSid;

        this.breaker = config.breaker || false;

        if (this.breaker == true) {
            this.bState = false;

            this.breakerService = new platform.Service.Switch(this.name + "_breaker");
            this.breakerState = this.breakerService.getCharacteristic(platform.Characteristic.On)
                .on('set', this.setBreakerState.bind(this))
                .updateValue(this.bState);

            this.services.push(this.breakerService);
        }

        this.delay = 1 * 1000;
        this.delayTimer = null;
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
                this.log.error("[%s]Change breaker failed! %s", this.name, err);
                callback(err);
            })
            .then(() => {
                this.platform.syncLock._exitSyncState();
            });
    }

    _startAcc() {
        this.ReadyState = true;
        //Sync
        this._stateSync();
        if (this.syncInterval > 0) {
            this.syncTimer = setInterval(() => {
                this._stateSync();
            }, this.syncInterval);
        } else {
            this.log.warn("[WARN]Sync function is off");
        }
    }
    
    //must have _updateState() function in child class
    _sendCmd(code, callback) {
        //Start send code
        let command;
        if (code.substr(0, 2) === "FE") {
            this.log.debug("[DEBUG]Sending IR code: %s", code);
            command = 'send_ir_code';
        } else {
            this.log.debug("[DEBUG]Sending AC code: %s", code);
            command = 'send_cmd';
        }
        const p1 = this.platform.devices[this.deviceIndex].call(command, [code])
            .then((data) => {
                if (data[0] === "ok") {
                    this.log.debug("[DEBUG]Success");
                } else {
                    throw new Error("partner return " + data[0]);
                }
                callback();
            })
            .catch((err) => {
                this.log.error("[%s]Send code failed! %s", this.name, err);
                callback(err);
            })
            .then(() => {
                this.platform.syncLock._exitSyncState();
            });

    }
    _sendCmdAsync(callback) {
        if (this.model === null || !this.ReadyState) {
            this.log.warn("[%s]Waiting for sync state, please try again after sync complete");
            callback(new Error("Waiting for device state"));
            return;
        }
        if (!this.platform.syncLock._enterSyncState(() => {
            this._sendCmdAsync(callback);
        })) {
            return;
        }

        //Start generate code
        let code;

        if (!this.customi) {
            //presets
            code = presetUtil(this.model, this.active, this.mode, this.temperature, this.swing, this.speed, this.led);
        } else {
            //customize
            code = this.customiUtil(this.active, this.mode, this.temperature);
            if (code === null || code === "") {
                this.log.warn("[WARN] Fallback to presets...");
                code = presetUtil(this.model, this.active, this.mode, this.temperature, this.swing, this.speed, this.led);
            }
        }

        clearTimeout(this.delayTimer);
        this.delayTimer = setTimeout(() => {
            this._sendCmd(code, callback);
        }, this.delay);
    }
    _fastSync() {
        //this function will  start _stateSync every 15 sec. And will end after 60 sec
        if (this.syncInterval <= 0) {
            return;
        }
        if (this.fastSyncTimer) {
            //Clear last fastSync timer
            clearInterval(this.fastSyncTimer);
            clearTimeout(this.fastSyncEnd);
        }
        //Clear normal syncState timer
        clearInterval(this.syncTimer);
        this.log.debug("[DEBUG]FastSync...");
        setImmediate(() => this._stateSync());
        this.fastSyncTimer = setInterval(() => {
            this._stateSync();
        }, 5 * 1000);
        this.fastSyncEnd = setTimeout(() => {
            clearInterval(this.fastSyncTimer);
            //Resume normal sync interval
            this.syncTimer = setInterval(() => {
                this._stateSync();
            }, this.syncInterval);
        }, 60 * 1000);
    }
    _stateSync() {
        if (!this.ReadyState) {
            return;
        }
        if (!this.platform.syncLock._enterSyncState(() => {
            this._stateSync();
        })) {
            return;
        }

        //Update CurrentTemperature
        const p1 = this.outerSensor && this.platform.devices[this.deviceIndex].call('get_device_prop_exp', [
            [this.outerSensor, "temperature", "humidity"]
        ])
            .then((senRet) => {
                if (this.lastSensorState !== senRet[0]) {
                    this.lastSensorState = senRet[0];

                    if (senRet[0][0] === null) {
                        throw (new Error("Error: Invaild sensorSid!"));
                    } else {
                        this.CurrentTemperature.updateValue(senRet[0][0] / 100.0);
                        this.CurrentRelativeHumidity.updateValue(senRet[0][1] / 100.0);
                        this.log.debug("[SENSOR]Temperature -> %s", this.CurrentTemperature.value);
                        this.log.debug("[SENSOR]RelativeHumidity -> %s", this.CurrentRelativeHumidity.value);
                    }
                }
            })


        //Update AC state
        const p2 = this.platform.devices[this.deviceIndex].call('get_model_and_state', [])
            .then((ret) => {
                if (this.lastPartnerState !== ret[1]) {
                    this.lastPartnerState = ret[1];

                    this.log.debug("Sync -----------------------------");
                    this.log.debug("Accessory -> %s", this.name);
                    const model = ret[0],
                        state = ret[1],
                        power = ret[2];

                    if (this.model !== model) {
                        this.model = model;
                    }
                    this.log.debug("Model -> %s", this.model.substr(0, 2) + this.model.substr(8, 8));

                    //Save all parameter to global
                    this.active = parseInt(state.substr(2, 1), 10);
                    this.mode = parseInt(state.substr(3, 1), 10);
                    this.temperature = parseInt(state.substr(6, 2), 16);
                    this.speed = parseInt(state.substr(4, 1), 10);
                    this.swing = 1 - parseInt(state.substr(5, 1), 10);
                    this.led = parseInt(state.substr(8, 1), 10);
                    this.log.debug("Active -> %s", this.active);
                    this.log.debug("Mode -> %s", this.mode);
                    this.log.debug("Temperature -> %s", this.temperature);
                    this.log.debug("RotationSpeed -> %s", this.speed);
                    this.log.debug("SwingMode -> %s", this.swing);
                    this.log.debug("LED -> %s", this.led);
                    this.log.debug("-----------------------------------");

                    //Use independence function to update accessory state
                    this._updateState();

                    if (this.outerSensor === undefined) {
                        this.CurrentTemperature.updateValue(this.temperature);
                    }
                }
            })


        Promise.all([p1, p2])
            .catch((err) => {
                this.log.error("[%s]Sync failed! %s", this.name, err);
            })
            .then(() => {
                this.platform.syncLock._exitSyncState();
            })
    }
}

//util.inherits(baseAC, base);
module.exports = baseAC;