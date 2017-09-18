// Base
// From YinHangCode
Base = function() {
    this.platform = null;
}

Base.prototype.init = function(platform, config) {
    this.platform = platform;
    this.config = config;
}

Base.prototype.obj2array = function(obj) {
    var array = [];
    for(var item in obj) {
        array.push(obj[item]);
    }
    return array;
}