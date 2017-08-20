# homebridge-mi-acpartner
[![npm version](https://badge.fury.io/js/homebridge-mi-acpartner.svg)](https://badge.fury.io/js/homebridge-mi-acpartner)

A homebridge plugin for xiaomi AC Partner.

Basic on [takatost's project](https://github.com/takatost/homebridge-mi-ac-partner) and [miio](https://github.com/aholstenson/miio),**thanks**.

This plugin is developing now, may cause some crush problem. 

### Feature

* Switch on / off.

* Control modes:

  - Lift ac partner temperature between 17 - 30. 

* Customize your AC's Signal

### Installation

1. Install required packages(include miio).

```
npm install -g homebridge-mi-acpartner miio
```

2. Follow this [Document](https://github.com/aholstenson/miio/blob/master/docs/management.md#getting-the-token-of-a-device) to get your token of AC Partner.

   If you are using Android, you can get token of AC Partner by using MIJIA app.

3. In you router, change the IP of AC Partner to static(If miio can easily regonize your device,this step is no longer need) 

4. Add following line to your config.json file

   Using Miio to discover your device and using perset AC command.

   Supported:
   - media: 1 
   - gree: 1,8

```
"accessories": [
        {
            "accessory": "XiaoMiAcPartner",
            "token": "token-as-hex",
            "name": "AcPartner",
            "brand": "media",
            "preset_no": "1"
        }
    ]
```

Using IP address to discover your device and using customize AC command.

```
"accessories": [
        {
            "accessory": "XiaoMiAcPartner",
            "token": "token-as-hex",
            "name": "AcPartner",
            "ip": "your_ac_partner_ip_address",
            "customize": {
                "off":"You_AC_Signal_Here",
                "heat":{
                    "30": "",
                    "29": "",
                    "17": ""
                },
                "cool":{
                    "30": "",
                    "29": "",
                    "17": ""
                }
            }
        }
    ]
```

Use this [method](https://github.com/aholstenson/miio/blob/master/docs/protocol.md#) to get you AC's command.Then fill into the customize tag.


 4. Restart Homebridge.


### Changelog
  0.0.4
  Fix a problem that customize signal cannot work.

  0.0.3
  Fix a problem that user cannot use presets.

  0.0.2
  Change Package.json to make Homebridge can run the plugin.

  0.0.1
  ADD Basic File.
