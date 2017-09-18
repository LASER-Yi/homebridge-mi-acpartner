// Base
const miio = require('miio');

Base = function() {
    this.platform = null;
}

Base.prototype = {
    discover: function(){
        var that = this;
        
        this.log.debug("[XiaoMiAcPartner][%s]Discovering...",this.name);
        miio.device({ address: this.config['ip'], token: this.config['token'] })
        .then(function(device){
            that.device = device;
            that.log("[XiaoMiAcPartner][CLIMATE]Discovered Device!",this.name);
        }).catch(function(err){
            that.log.error("[XiaoMiAcPartner][ERROR]Cannot connect to AC Partner. " + err);
        })
    }
}
