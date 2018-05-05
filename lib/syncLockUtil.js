const events = require('events');

class syncLockUtil {
    constructor(platform) {
        this.platform = platform;

        this.syncCount = 0;
        this.syncLockEvent = new events.EventEmitter();

    }

    _enterSyncState(_function) {
        if (this.syncCount >= 5) {
            this.syncLockEvent.once("lockDrop", () => {
                _function();
            })
            return false;
        } else {
            this.syncCount++;
            //this.log.debug("[DEBUG]Enter SyncState #%s", this.syncCounter);
            return true;
        }
    }
    _exitSyncState() {
        this.syncLockEvent.emit("lockDrop");
        //this.log.debug("[DEBUG]Exit SyncState #%s", this.syncCount);
        if (this.syncCounter > 0) {
            this.syncCounter--;
        } else {
            this.syncCounter = 0;
        }
    }
}

module.exports = syncLockUtil;