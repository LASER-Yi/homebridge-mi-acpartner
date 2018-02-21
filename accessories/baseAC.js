const base = require('./base');
const util = require('util');

const presetUtil = require("../lib/presetUtil");

var Service, Characteristic, Accessory;

class baseAC {
    constructor(config, platform) { }
    
    /**Need _syncBack() and _updateState() function in child object*/
    _sendCmd(code) {
        if (code.substr(0, 2) == "FE") {
            this.log.debug("[DEBUG]Sending IR code: " + code);
            code_comm = 'send_ir_code';
        } else {
            this.log.debug("[DEBUG]Sending AC code: " + code);
            code_comm = 'send_cmd';
        }
        this.platform.devices[this.deviceIndex].call(code_comm, [code])
            .then((data) => {
                if (data[0] == "ok") {
                    this.log.debug("[DEBUG]Success");
                } else {
                    this.log.debug("[DEBUG]Failed!(Maybe invaild code?)");
                }
            }).catch((err) => {
                this.log.error("[%s]Send code failed! " + err, this.name);
            })
    }
    _sendCmdAsync(callback) {
        if (this.model == null) {
            this.log.warn("[%s]Waiting for sync state, please try again after sync complete");
            callback();
            return;
        }
        if (!this.platform._enterSyncState()) {
            this.platform.syncLockEvent.once("lockDrop", (() => {
                this._sendCmd(callback);
            }));
            return;
        }
        let code;
        //Sync current state back to value;
        this._syncBack();

        if (!this.customi) {
            //presets
            code = presetUtil(this.model, this.active, this.mode, this.temperature, this.swing, this.speed, this.led);
        } else {
            //customi
            code = customiUtil();
        }
        if (code == null) callback();
        let code_comm;
        if (code.substr(0, 2) == "FE") {
            this.log.debug("[DEBUG]Sending IR code: " + code);
            code_comm = 'send_ir_code';
        } else {
            this.log.debug("[DEBUG]Sending AC code: " + code);
            code_comm = 'send_cmd';
        }
        this.platform.devices[this.deviceIndex].call(code_comm, [code])
            .then((data) => {
                if (data[0] == "ok") {
                    this.log.debug("[DEBUG]Success");
                } else {
                    this.log.debug("[DEBUG]Failed!(Maybe invaild code?)");
                }
            }).catch((err) => {
                this.log.error("[%s]Send code failed! " + err, this.name);
            }).then(() => {
                callback();
                this.platform._exitSyncState();
            });
    }
    _stateSync() {
        if (!this.platform._enterSyncState()) {
            this.platform.syncLockEvent.once("lockDrop", (() => {
                this.setSwitchState(value, callback);
            }));
            return;
        }
        this.log.debug("[%s]Syncing...", this.name);

        //Update CurrentTemperature
        let p1 = this.outerSensor && this.platform.devices[this.deviceIndex].call('get_device_prop_exp', [[this.outerSensor, "temperature", "humidity"]])
            .then((senRet) => {
                if (senRet[0][0] == null) {
                    this.log.warn("[WARN]Invaild sensorSid!")
                } else {
                    this.CurrentTemperature.updateValue(senRet[0][0] / 100.0);
                    this.CurrentRelativeHumidity.updateValue(senRet[0][1] / 100.0);
                }
            }).catch((err) => {
                this.log.warn("[WARN]Failed to update current temperature! " + err);
            });

        //Update AC state
        let p2 = this.platform.devices[this.deviceIndex].call('get_model_and_state', [])
            .then(ret => {
                let model = ret[0],
                    state = ret[1],
                    power = ret[2];

                if (this.model !== model) {
                    this.model = model;
                }

                //Save active, mode, temperature parameter to global
                this.active = state.substr(2, 1) - 0;
                this.mode = state.substr(3, 1);
                this.temperature = parseInt(state.substr(6, 2), 16);
                this.speed = state.substr(4, 1) - 0 + 1;
                this.swing = 1 - state.substr(5, 1);
                this.led = state.substr(8, 1);

                //Use independence function to update accessory state
                this._updateState(this.active, this.mode, this.speed, this.swing, this.temperature, this.led, this.power);

                if (this.outerSensor == null) {
                    this.CurrentTemperature.updateValue(this.temperature);
                }
            }).catch((err) => {
                this.log.error("[ERROR]Failed to update AC state! " + err);
            });

        Promise.all([p1, p2])
            .then(() => {
                this.platform._exitSyncState();
                this.log.debug("[%s]Sync complete",this.name);
            });
    }
}

util.inherits(baseAC, base);
module.exports = baseAC;