var miio = require('miio');
var outputSignal = require("./packages/acSignal_handle");
var Accessory, Service, Characteristic;

//Listening Server
const dgram = require('dgram');
const serverSocket = dgram.createSocket({
    type: 'udp4',
    reuseAddr: true
});
const multicastAddress = '224.0.0.50';
const multicastPort = 4321;
const serverPort = 9898;


module.exports = function(homebridge) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-mi-acpartner', 'XiaoMiAcPartner', XiaoMiAcPartner);
}

function XiaoMiAcPartner(log, config) {
    if(null == config) {
        this.log.error('[XiaoMiAcPartner][WARN] Cannot find config');
        return;
    }

    //Init
    var that = this;
    this.log = log;
    this.name = config.name;
    this.token = config.token;
    this.ip = config.ip;
    this.LastHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;

    //Optional
    this.maxTemp = parseInt(config.maxTemp) || 30;
    this.minTemp = parseInt(config.minTemp) || 17;
    this.sendType = "AC";
    this.outerTemSen = config.sensor;
    this.gatewayIpAddress;
    this.gatewayPort;

    if (config.customize == null) {
        this.config = config;
        this.customi = false;
        this.data = JSON;
        this.log.debug("[XiaoMiAcPartner][DEBUG] Using presets...");
        var presets = require('./presets.json');
            if (!presets[config.brand] || !presets[config.brand][config.preset_no]) {
                this.log.error('[XiaoMiAcPartner][WARN] Brand or preset_no invalid');
            } else {
                this.data.model = this.config.brand;
                this.data.preset_no = this.config.preset_no;
                this.data.defaultState = Characteristic.TargetHeatingCoolingState;
            }        
    }else{
        this.customi = config.customize;
        if (this.customi.type != null) {
            this.sendType = this.customi.type;
        }
        this.log.debug("[XiaoMiAcPartner][DEBUG] Using customized AC signal...");
    }

    this.services = [];

    //Register as Thermostat
    this.acPartnerService = new Service.Thermostat(this.name);

      this.acPartnerService
          .getCharacteristic(Characteristic.TargetHeatingCoolingState)
        .on('set', this.setTargetHeatingCoolingState.bind(this))
        .on('get', this.getTargetHeatingCoolingState.bind(this));

    this.acPartnerService
        .getCharacteristic(Characteristic.TargetTemperature)
        .setProps({
            maxValue: that.maxTemp,
            minValue: that.minTemp,
            minStep: 1
        })
        .on('set', this.setTargetTemperature.bind(this))
        .on('get', this.getTargetTemperature.bind(this));

    this.acPartnerService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({
            maxValue: 40,
            minValue: -20,
            minStep: 1
        })
        .on('get', this.getCurrentTemperature.bind(this));;

    this.services.push(this.acPartnerService);

    this.serviceInfo = new Service.AccessoryInformation();

    this.serviceInfo
        .setCharacteristic(Characteristic.Manufacturer, 'XiaoMi')
        .setCharacteristic(Characteristic.Model, 'AC Partner');
    
    this.services.push(this.serviceInfo);

    this.discover();

    this.doRestThing();

}

XiaoMiAcPartner.prototype = {
    doRestThing: function(){
        var that = this;
        if (this.outerTemSen) {
            this.startServer();
            //outer Temp Sensor
            that.sendWhoisCommand();
            
            setInterval(function() {
                that.sendWhoisCommand();
            }, 300000);   
        }

        setInterval(function() {
            that.getACState();
        }, 60000);
    },

    discover: function(){
        var accessory = this;
        var log = this.log;
        var token = this.token;
        this.log('[XiaoMiAcPartner][INFO] Searching AC Partner...');
        // Discover device in the network

        miio.device({ address: this.ip, token: this.token })
            .then(function(device){
                accessory.device = device;
                log.debug('[XiaoMiAcPartner][DEBUG] Discovered "%s" (ID: %s) on %s:%s.', device.hostname, device.id, device.address, device.port);
                accessory.getACState();
            })
    },

    getTargetHeatingCoolingState: function(callback) {
        callback(null, this.TargetHeatingCoolingState);
    },

    setTargetHeatingCoolingState: function(TargetHeatingCoolingState, callback, context) {
        if(context !== 'fromSetValue') {
            this.TargetHeatingCoolingState = TargetHeatingCoolingState;
            if (this.TargetHeatingCoolingState == Characteristic.TargetHeatingCoolingState.OFF) {
                this.log("[XiaoMiAcPartner][INFO] AC turned off");
            }
            
            if (this.sendType == "IR") {
                this.sendIrCmd();
            }else{
                this.SendCmd();
            }
        }
        callback();
    },

    getTargetTemperature: function(callback) {
        this.getACState();
        callback(null, this.TargetTemperature);
    },

    setTargetTemperature: function(TargetTemperature, callback, context) {
        if(context !== 'fromSetValue') {
              this.TargetTemperature = TargetTemperature;
              if (this.TargetHeatingCoolingState == Characteristic.TargetHeatingCoolingState.OFF) {
                this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;
                this.acPartnerService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
                    .updateValue(this.TargetHeatingCoolingState);
              }

            if (!this.outerTemSen) {
                // Update current temperature
                this.acPartnerService
                    .getCharacteristic(Characteristic.CurrentTemperature)
                    .updateValue(parseFloat(TargetTemperature));
            }

            this.log.debug('[XiaoMiAcPartner][DEBUG] Set temperature: ' + TargetTemperature);

            if (this.sendType == "IR") {
                this.sendIrCmd();
            }else{
                this.SendCmd();
            }
        }

        callback();
    },

    getCurrentTemperature: function(callback) {
        if (!this.outerTemSen) {
            this.log("[XiaoMiAcPartner][INFO] CurrentTemperature %s", this.TargetTemperature);
            callback(null, parseFloat(this.TargetTemperature));
        }else{
            var response = '{"cmd":"read", "sid":"' + this.outerTemSen.sensorName + '"}';
            serverSocket.send(response, 0, response.length, this.gatewayPort, this.gatewayIpAddress);
            callback(null, parseFloat(this.CurrentTemperature));
        }
    },

    identify: function(callback) {
        callback();
    },

    getServices: function() {
        return this.services;
    },

    startServer: function() {
        var that = this;

        // Initialize a server socket for Aqara gateways.
        serverSocket.on('message', this.serverMessage.bind(this));
    
        // err - Error object, https://nodejs.org/api/errors.html
        serverSocket.on('error', function(err){
            that.log.error('[XiaoMiAcPartner][ERROR]error, msg - %s, stack - %s\n', err.message, err.stack);
        });
    
        // Show some message
        serverSocket.on('listening', function(){
            that.log.debug("[XiaoMiAcPartner][DEBUG]Outer Temp Senser server is listening on port 9898.");
            serverSocket.addMembership(multicastAddress);
        });
    
        // Start server
        serverSocket.bind(serverPort);
    },

    // Parse message which is sent from Aqara gateways
    serverMessage: function(msg, rinfo){
        var that = this;
        var json;
        try {
            json = JSON.parse(msg);
        } catch (ex) {
            that.log.error("[XiaoMiAcPartner][ERROR] Bad json %s", msg);
            return;
        }

        var cmd = json['cmd'];
        if (cmd === 'iam') {
            this.gatewayIpAddress = json['ip'];
            this.gatewayPort = json['port'];
            this.log.debug("[XiaoMiAcPartner][INFO] Gateway ip:%s:%s",this.gatewayIpAddress,this.gatewayPort);
        }else if (cmd === 'heartbeat' || cmd === 'read_ack') {
            var model = json['model'];
            if (model === 'sensor_ht' || model === 'weather.v1') {
                var sid = json['sid'];
                if (sid != this.outerTemSen.sensorName) {
                    return;
                }

                var data = JSON.parse(json['data']);
                this.CurrentTemperature = data['temperature'] / 100.0;
                this.acPartnerService.getCharacteristic(Characteristic.CurrentTemperature)
                .updateValue(this.CurrentTemperature);
                this.log.debug("[XiaoMiAcPartner][INFO] Update CurrentTemperature %s", this.CurrentTemperature)
            }else if (model === 'gateway') {
                var sid = json['sid'];
                if (sid != this.outerTemSen.gatewaySid) {
                    return;
                }

                var data = JSON.parse(json['data']);
                this.gatewayIpAddress = data['ip'];
            }else{
                this.log.error("[XiaoMiAcPartner][WARN] sensorName invaild!")
            }
        }
    },

    sendWhoisCommand: function(){
        // Send whois to discovery Aqara gateways and resend every 300 seconds
        var whoisCommand = '{"cmd": "whois"}';
        // this.log.debug("[MiAqaraPlatform][DEBUG]send %s to %s:%d", whoisCommand, multicastAddress, multicastPort);
        serverSocket.send(whoisCommand, 0, whoisCommand.length, multicastPort, multicastAddress);
    },

    getCuSignal: function(){
        var code;
        if (this.LastHeatingCoolingState == Characteristic.TargetHeatingCoolingState.OFF && this.customi.on) {
            code = this.customi.on;
            this.log.debug("[XiaoMiAcPartner][DEBUG] AC on, sending code: " + code);
            this.device.call('send_cmd', [code]);
        }
        if (this.TargetHeatingCoolingState != Characteristic.TargetHeatingCoolingState.OFF) {
            if (this.TargetHeatingCoolingState == Characteristic.TargetHeatingCoolingState.HEAT) {
                if (!this.customi||!this.customi.heat[this.TargetTemperature]) {
                    this.log.error('[XiaoMiAcPartner][WARN] HEAT Signal not define!');
                    return;
                }
                code = this.customi.heat[this.TargetTemperature];
            }else if (this.TargetHeatingCoolingState == Characteristic.TargetHeatingCoolingState.COOL){
                if (!this.customi||!this.customi.cool[this.TargetTemperature]) {
                    this.log.error('[XiaoMiAcPartner][WARN] COOL Signal not define!');
                    return;
                }
                code = this.customi.cool[this.TargetTemperature];
            }else{
                if (!this.customi||!this.customi.auto) {
                    this.log.error('[XiaoMiAcPartner][WARN] AUTO Signal not define! Will send COOL signal instead');
                    if (!this.customi||!this.customi.cool[this.TargetTemperature]) {
                        this.log.error('[XiaoMiAcPartner][WARN] COOL Signal not define!');
                        return;
                    }
                    code = this.customi.cool[this.TargetTemperature];
                }else{
                    code = this.customi.auto;
                }
            }
        }else{
            if (!this.customi||!this.customi.off) {
                this.log.error('[XiaoMiAcPartner][WARN] OFF Signal not define!');
                return;
            }
            code = this.customi.off;
        }
        return code;
    },

    SendCmd: function() {
        if (!this.device) {
            this.log.error('[XiaoMiAcPartner][WARN] Send code failed!(Device not exists)');
            return;
        }

        var accessory = this;
        var code;
        this.log.debug("[XiaoMiAcPartner][DEBUG] Last TargetHeatingCoolingState: " + this.LastHeatingCoolingState);
        this.log.debug("[XiaoMiAcPartner][DEBUG] Current TargetHeatingCoolingState: " + this.TargetHeatingCoolingState);
        if (!this.customi) {
            this.data.CurrentTemperature = this.CurrentTemperature;
            this.data.TargetTemperature = this.TargetTemperature;
            this.data.TargetHeatingCoolingState = this.TargetHeatingCoolingState;
            this.data.LastHeatingCoolingState = this.LastHeatingCoolingState;
            var retCode = outputSignal(this.data);
            if (!retCode) {
                this.log.error('[XiaoMiAcPartner][WARN] Command code invalid, brand or preset_no not set right?')
                return;
            }
            //this.log.debug("[XiaoMiAcPartner][DEBUG] Get code: " + retCode.data);
            code = retCode.data;
            delete retCode;

        }else{
            code = this.getCuSignal();
        }

        this.log.debug("[XiaoMiAcPartner][DEBUG] Sending code: " + code);
        this.device.call('send_cmd', [code])
            .then(function(data){
                if (data[0] == "ok") {
                    accessory.LastHeatingCoolingState = accessory.TargetHeatingCoolingState;
                    accessory.log.debug("[XiaoMiAcPartner][DEBUG] Change Successful");
                }else{
                    accessory.log.debug("[XiaoMiAcPartner][DEBUG] Unsuccess! Maybe invaild AC Code?");
                    accessory.getACState();
                }
            });
    },

    sendIrCmd :function(){
        if (!this.device) {
            this.log.error('[XiaoMiAcPartner][WARN] Send IR code failed!(Device not exists)');
            return;
        }

        var accessory = this;
        var irCode;
        this.log.debug("[XiaoMiAcPartner][DEBUG] Last TargetHeatingCoolingState: " + this.LastHeatingCoolingState);
        this.log.debug("[XiaoMiAcPartner][DEBUG] Current TargetHeatingCoolingState: " + this.TargetHeatingCoolingState);

        //
        irCode = this.getCuSignal();
        this.log.debug("[XiaoMiAcPartner][DEBUG] Sending IR code: " + irCode);
        this.device.call('send_ir_code', [irCode])
            .then(function(data){
                if (data[0] == "ok") {
                    accessory.LastHeatingCoolingState = accessory.TargetHeatingCoolingState;
                    accessory.log.debug("[XiaoMiAcPartner][DEBUG] Send Successful");
                }else{
                    accessory.log.debug("[XiaoMiAcPartner][DEBUG] Unsuccess! Maybe invaild IR Code?");
                    accessory.getACState();
                }
            });
    },

    getACState: function(){
        if (!this.device) {
            this.log.error("[XiaoMiAcPartner][WARN] Sync failed!(Device not exists)");
            return;
        }

        var acc = this;
        this.log.debug("[XiaoMiAcPartner][INFO] Syncing...")
        this.device.call('get_model_and_state', [])
            .then(function(retMaS){
                acc.acPower = retMaS[2];
                acc.acModel = retMaS[0].substr(0,2) + retMaS[0].substr(8,8);
                var power = retMaS[1].substr(2,1);
                var mode = retMaS[1].substr(3,1);
                var wind_force = retMaS[1].substr(4,1);
                var sweep = retMaS[1].substr(5,1);
                var temp = parseInt(retMaS[1].substr(6,2),16);
                acc.log.debug("[XiaoMiAcPartner][DEBUG] Partner_State:(model:%s, power_state:%s, mode:%s, wind:%s, sweep:%s, temp:%s, AC_POWER:%s",acc.acModel,power,mode,wind_force,sweep,temp,acc.acPower);

                //update values
                if (power == 1) {
                    if (mode == 0) {
                        acc.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.HEAT;
                    }else if (mode == 1) {
                        acc.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.COOL;
                    }else{
                        acc.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;
                    }
                }else{
                    acc.LastHeatingCoolingState = acc.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
                }
                acc.acPartnerService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
                    .updateValue(acc.TargetHeatingCoolingState);
                acc.TargetTemperature = temp;
                acc.acPartnerService.getCharacteristic(Characteristic.TargetTemperature)
                    .updateValue(acc.TargetTemperature);
                acc.log.debug("[XiaoMiAcPartner][INFO] Sync complete")
            });
    }
};
