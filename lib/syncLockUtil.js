
class syncLockUtil {
    constructor(platform) {
        this.platform = platform;
        this.log = platform.log;

        this.syncCount = 0;
        this.funcQueue = [];
        this.maxSyncNumber = 5;

    }

    _push2Queue(_function) {
        this.funcQueue.push(_function);
    }

    _shift2Queue() {
        if (this.funcQueue.length != 0) {
            const func = this.funcQueue.shift();
            func();
        }
    }

    _enterSyncState(_function) {
        if (this.syncCount >= this.maxSyncNumber) {
            this._push2Queue(_function);
            return false;
        } else {
            this.syncCount++;
            // this.log.debug("[DEBUG]Enter SyncState #%s", this.syncCount);
            return true;
        }
    }
    _exitSyncState() {
        // this.log.debug("[DEBUG]Exit SyncState #%s", this.syncCount);
        if (this.syncCount > 0) {
            this.syncCount--;
        } else {
            this.syncCount = 0;
        }
        this._shift2Queue();
    }
}

module.exports = syncLockUtil;