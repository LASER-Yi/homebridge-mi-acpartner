const miio = require('miio');
const events = require('events');

class connectUtil {
    constructor(devices, log, platform) {
        this.platform = platform;
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
            this.platform.devices.push(miio.createDevice({
                address: elemenet,
                token: this.configDevices[elemenet]
            }));
            this._search(elemenet, this.configDevices[elemenet], this.platform.devices.length - 1);
        }
    }
    _search(thisIp, thisToken, index) {
        if (!this.platform._enterSyncState()) {
            this.platform.syncLockEvent.once("lockDrop", (() => {
                this._search(thisIp, thisToken, index);
            }));
            return;
        }
        //Try to connect to miio device
        this.log.info("[INFO]Device %s -> Connecting", thisIp);
        miio.device({
            address: thisIp,
            token: thisToken
        }).then((retDevice) => {
            this.platform.devices[index] = retDevice;
            this.log.info("[INFO]Device %s -> Connected", thisIp);
        }).catch((err) => {
            this.log.error("[ERROR]Device %s -> Connect error", thisIp);
            this.log.warn("[WARN]Add '-D' parameter to show more information.");
            this.log.debug(err);
            setTimeout((() => {
                this.connectCounter++;
                if (this.connectCounter <= 3) {
                    this.log.info("[INFO]Device %s -> Reconnecting", thisIp);
                    this._search(thisIp, thisToken, index);
                } else {
                    this.log.warn("[WARN]Using 'generic' miio device instead.");
                    this.connectCounter = 0;
                }
            }), 30 * 1000);
        }).then(() => {
            /** When connect finish, exit sync state*/
            this.platform._exitSyncState();
        })
    }
    refresh() {
        if (this.syncLock == true) {
            this.syncLockEvent.once("lockDrop", (() => {
                this.refresh();
            }))
            return;
        }
        this.platform._exitSyncState();
        this.log.debug("[DEBUG]Start refresh devices");
        for (var elemenet in this.configDevices) {
            this._search(elemenet, this.configDevices[elemenet], this.platform.devices.length - 1);
        }
    }
}

module.exports = connectUtil;