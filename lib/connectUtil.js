const miio = require('miio');
const events = require('events');

class connectUtil {
    constructor(devices, platform) {
        this.platform = platform;
        this.log = platform.log;
        this.configDevices = devices;

        this.retryCount = [];

        /* Start search */
        this.searchAsync();
    }
    searchAsync() {
        for (const element in this.configDevices) {
            var _addr = element;
            var _token = this.configDevices[element];
            /*this.platform.devices.push(miio.createDevice({
                address: _addr,
                token: _token
            }));*/
            this.platform.devices.push(null);
            this.retryCount.push(0);
            this._search(_addr, _token, this.platform.devices.length - 1);
        }
    }
    _search(thisIp, thisToken, index) {
        if (!this.platform.syncLock._enterSyncState(() => {
            this._search(thisIp, thisToken, index);
        })) {
            return;
        }

        this.retryCount[index]++;
        //Try to connect to miio device
        this.log.info("[INFO]Device %s -> Connecting", thisIp);
        miio.device({
            address: thisIp,
            token: thisToken
        }).then((retDevice) => {
            this.platform.devices[index] = retDevice;
            this.log.info("[INFO]Device %s -> Connected", thisIp);
            this.platform.startEvent.emit(index);
        }).catch((err) => {
            this.log.error("[ERROR]Device %s -> %s", thisIp, err);
            setTimeout((() => {
                if (this.retryCount[index] <= 3) {
                    this._search(thisIp, thisToken, index);
                } else {
                    this.log.warn("[WARN]Cannot connect to device %s!", thisIp);
                    this.retryCount[index] = 0;
                }
            }), 30 * 1000);
        }).then(() => {
            this.platform.syncLock._exitSyncState();
        })
    }
    refresh() {
        this.log.debug("[DEBUG]Start refresh devices");
        for (var element in this.configDevices) {
            this._search(element, this.configDevices[element], this.platform.devices.length - 1);
        }
    }
}

module.exports = connectUtil;