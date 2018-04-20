const base = require('./base');

const presetUtil = require("../lib/presetUtil");

class baseAC extends base {
    constructor(config, platform) {
        super(config, platform);
    }
    //need _updateState() function in child object
    _sendCmd(code) {
        let codeCommand;
        if (code.substr(0, 2) === "FE") {
            this.log.debug("[DEBUG]Sending IR code: %s", code);
            codeCommand = 'send_ir_code';
        } else {
            this.log.debug("[DEBUG]Sending AC code: %s", code);
            codeCommand = 'send_cmd';
        }
        this.platform.devices[this.deviceIndex].call(codeCommand, [code])
            .then((data) => {
                if (data[0] === "ok") {
                    this.log.debug("[DEBUG]Success");
                } else {
                    this.log.debug("[DEBUG]Failed!(Maybe invaild code?)");
                }
            })
            .catch((err) => {
                this.log.error("[%s]Send code failed! %s", this.name, err);
            })
    }
    _sendCmdAsync(callback) {
        if (this.model === null) {
            this.log.warn("[%s]Waiting for sync state, please try again after sync complete");
            callback();
            return;
        }
        if (!this.platform._enterSyncState()) {
            this.platform.syncLockEvent.once("lockDrop", (() => {
                this._sendCmdAsync(callback);
            }));
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
        }
        if (code === null) {
            callback();
            return;
        }

        //Start send code
        let command;
        if (code.substr(0, 2) === "FE") {
            this.log.debug("[DEBUG]Sending IR code: %s", code);
            command = 'send_ir_code';
        } else {
            this.log.debug("[DEBUG]Sending AC code: %s", code);
            command = 'send_cmd';
        }
        this.platform.devices[this.deviceIndex].call(command, [code])
            .then((data) => {
                if (data[0] === "ok") {
                    this.log.debug("[DEBUG]Success")
                }
                callback();
            })
            .catch((err) => {
                this.log.error("[%s]Send code failed! %s", this.name, err);
                callback(err);
            })
            .then(() => {
                this.platform._exitSyncState();
                //After sending the code, sync AC state again after 100ms.
                if (this.syncInterval > 0) {
                    setTimeout(() => {
                        this._stateSync();
                    }, 100);
                }
            });
    }
    _fastSync() {
        //this function will  start _stateSync every 5 sec. And will end in 30 sec
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
        this.log.debug("[DEBUG]Enter fastSync");
        setImmediate(() => this._stateSync());
        this.fastSyncTimer = setInterval(() => {
            this._stateSync();
        }, 5 * 1000);
        this.fastSyncEnd = setTimeout(() => {
            clearInterval(this.fastSyncTimer);
            this.log.debug("[DEBUG]Exit fastSync");
            //Resume normal sync interval
            this.syncTimer = setInterval(() => {
                this._stateSync();
            }, this.syncInterval);
        }, 30 * 1000);
    }
    _stateSync() {
        if (!this.platform._enterSyncState()) {
            this.platform.syncLockEvent.once("lockDrop", (() => {
                this._stateSync();
            }));
            return;
        }
        this.log.debug("[%s]Syncing...", this.name);

        //Update CurrentTemperature
        const p1 = this.outerSensor && this.platform.devices[this.deviceIndex].call('get_device_prop_exp', [
                [this.outerSensor, "temperature", "humidity"]
            ])
            .then((senRet) => {
                if (senRet[0][0] === null) {
                    throw (new Error("Error: Invaild sensorSid!"));
                } else {
                    this.CurrentTemperature.updateValue(senRet[0][0] / 100.0);
                    this.CurrentRelativeHumidity.updateValue(senRet[0][1] / 100.0);
                    this.log.debug("[SENSOR]Temperature -> %s", this.CurrentTemperature.value);
                    this.log.debug("[SENSOR]RelativeHumidity -> %s", this.CurrentRelativeHumidity.value);
                }
            })
            

        //Update AC state
        const p2 = this.platform.devices[this.deviceIndex].call('get_model_and_state', [])
            .then((ret) => {
                this.log.debug("Partner state----------------------");
                const model = ret[0],
                    state = ret[1],
                    power = ret[2];

                if (this.model !== model) {
                    this.model = model;
                }
                this.log.debug("Model -> %s", this.model.substr(0, 2) + this.model.substr(8, 8));

                //Save all parameter to global
                this.active = state.substr(2, 1);
                this.mode = state.substr(3, 1);
                this.temperature = parseInt(state.substr(6, 2), 16);
                this.speed = state.substr(4, 1);
                this.swing = 1 - state.substr(5, 1);
                this.led = state.substr(8, 1);
                this.log.debug("Active -> %s", this.active);
                this.log.debug("Mode -> %s", this.mode);
                this.log.debug("Temperature -> %s", this.temperature);
                this.log.debug("RotationSpeed -> %s", this.speed);
                this.log.debug("SwingMode -> %s", this.swing);
                this.log.debug("LED -> %s", this.led);
                this.log.debug("-----------------------------------");

                //Use independence function to update accessory state
                this._updateState();

                if (!this.outerSensor === null) {
                    this.CurrentTemperature.updateValue(this.temperature);
                }
            })


        Promise.all([p1, p2])
            .then(() => {
                this.log.debug("[%s]Complete", this.name);
            })
            .catch((err) => {
                this.log.error("[%s]Sync failed! %s", this.name, err);
            })
            .then(() => {
                this.platform._exitSyncState();
            })
    }
}

//util.inherits(baseAC, base);
module.exports = baseAC;