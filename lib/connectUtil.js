const miio = require('miio');

class connectUtil {
    constructor(devices, platform) {
        this.platform = platform;
        this.log = platform.log;
        this.configDevices = devices;

        /* Start search */
        this.searchAsync();
    }

    searchAsync() {
        for (const element in this.configDevices) {
            const _addr = element;
            const _token = this.configDevices[element];
            this.platform.devices.push(miio.createDevice({
                address: _addr,
                token: _token
            }));
            const index = this.platform.devices.length - 1
            this._search(_addr, _token, index, 0);
        }
    }

    _search(thisIp, thisToken, index, retryCount) {
        if (!this.platform.syncLock._enterSyncState(() => {
            this._search(thisIp, thisToken, index);
        })) {
            return;
        }

        //Try to connect to miio device
        this.log.info("[INFO]Device#%s %s -> Connecting", index, thisIp);
        miio.device({
            address: thisIp,
            token: thisToken
        }).then((retDevice) => {
            this.platform.devices[index] = retDevice;
            this.log.info("[INFO]Device %s -> Connected", thisIp);

            this.platform.startEvent.emit(index + "_ready");
        }).catch((err) => {
            this.log.error("[ERROR]Device %s -> %s", thisIp, err);
            // Wait 30 sec and try again
            setTimeout((() => {
                if (retryCount < 3) {
                    this._search(thisIp, thisToken, index, retryCount + 1);
                } else {
                    this.log.warn("[WARN]Cannot connect to device %s!", thisIp);
                }
            }), 30 * 1000);
        }).then(() => {
            this.platform.syncLock._exitSyncState();
        })
    }

    refresh() {
        this.log.debug("[DEBUG]Start refresh devices");
        // var index = 0
        this.platform.devices.forEach((element, index) => {
            if(element){
                let address = element.address;
                let token = element.token || element.packet ? element.packet.token : null;
                if (address && token) {
                    this._search(address, token, index, 0);
                }
            }
        })
        // for (var element in this.configDevices) {
        //     this._search(element, this.configDevices[element], index, 0);
        //     index += 1
        // }
    }
}

module.exports = connectUtil;
