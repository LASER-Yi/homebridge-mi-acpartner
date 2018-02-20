const miio = require('miio');
const events = require('events');

class connectUtil {
    constructor(devices, log) {
        this.devices = [];
        this.log = log;
        this.configDevices = devices;

        /* Sync util */
        this.syncLock = false; //true: something using; false: free to use
        this.syncLockEvent = new events.EventEmitter();
        this.connectCounter = 0;

        /* Start search */
        this.searchAsync();
    }
    searchAsync() {
        for (var elemenet in this.configDevices) {
            this.devices.push(miio.createDevice({
                address: elemenet,
                token: this.configDevices[elemenet]
            }));
            this._search(elemenet, this.configDevices[elemenet], this.devices.length - 1);
        }
    }
    _search(thisIp, thisToken, index) {
        if (this.syncLock == true) {
            this.syncLockEvent.once("lockDrop", (() => {
                this._search(thisIp, thisToken, index);
            }))
            return;
        }
        this._enterSyncState()
        //Try to connect to miio device
        this.log("[INFO]Device %s -> Connecting", thisIp);
        let p = miio.device({
            address: thisIp,
            token: thisToken
        }).then((retDevice) => {
            this.devices[index] = retDevice;
            this.log("[INFO]Device %s -> Connected", thisIp);
        }).catch((err) => {
            this.log.error("[ERROR]Device %s -> Connect error", thisIp);
            this.log.error("[INFO]Add '-D' parameter to show more information.");
            this.log.debug(err);
            setTimeout((() => {
                this.connectCounter++;
                if (this.connectCounter <= 5) {
                    this.log("[INFO]Device %s -> Start reconnect", thisIp);
                    this._search(thisIp, thisToken, index);
                } else {
                    this.log.error("[INFO]Using 'generic' miio device instead.");
                    this.connectCounter = 0;
                }
            }), 10 * 1000);
            });
        /* When Connect finish, exit sync state*/
        Promise.resolve(p)
            .then(() => {
                this._exitSyncState();
            });
    }
    refresh() {
        if (this.syncLock) return;

        this.log.debug("[DEBUG]Start refresh devices");
        for (var elemenet in this.configDevices) {
            this._search(elemenet, this.configDevices[elemenet], this.devices.length - 1);
        }
    }
    getDeviceByIndex(index,callback) {
        if (this.syncLock == true) {
            this.syncLockEvent.once("lockDrop", (() => {
                /**Callback device when syncLock disable */
                callback(this.devices[index]);
            }))
        } else {
            callback(this.devices[index]);
        }
    }
    _enterSyncState() {
        this.log.debug("[DEBUG]syncLock enable");
        this.syncLock = true;
    }
    _exitSyncState() {
        this.log.debug("[DEBUG]syncLock disable");
        this.syncLock = false;
        this.syncLockEvent.emit("lockDrop");
    }
}

module.exports = connectUtil;