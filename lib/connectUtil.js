const miio = require('miio');
const events = require('events');

class connectUtil {
    constructor(devices, platform) {
        this.platform = platform;
        this.log = platform.log;
        this.configDevices = devices;

        /* Sync util */
        this.connectCounter = 0;

        /* Start search */
        this.searchAsync();
    }
    searchAsync() {
        for (var elemenet in this.configDevices) {
            var _addr = elemenet;
            var _token = this.configDevices[elemenet];
            this.platform.devices.push(miio.createDevice({
                address: _addr,
                token: _token
            }));
            this.log.info("[INFO]Device %s -> Connecting", elemenet);
            setImmediate(() => {
                this._search(_addr, _token, this.platform.devices.length - 1);
            })
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
        miio.device({
            address: thisIp,
            token: thisToken
        }).then((retDevice) => {
            this.platform.devices[index] = retDevice;
            this.log.info("[INFO]Device %s -> Connected", thisIp);
        }).catch((err) => {
            this.log.error("[ERROR]Device %s -> Not Connected", thisIp);
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
        this.log.debug("[DEBUG]Start refresh devices");
        for (var elemenet in this.configDevices) {
            setImmediate(() => {
                this._search(elemenet, this.configDevices[elemenet], this.platform.devices.length - 1);
            })
        }
    }
}

module.exports = connectUtil;