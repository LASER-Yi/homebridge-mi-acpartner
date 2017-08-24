# homebridge-mi-acpartner
[![npm version](https://badge.fury.io/js/homebridge-mi-acpartner.svg)](https://badge.fury.io/js/homebridge-mi-acpartner)

XiaoMi AC Partner plugins for HomeBridge.

Thanks for [takatost's project](https://github.com/takatost/homebridge-mi-ac-partner),  [miio](https://github.com/aholstenson/miio) and all other developer and testers.

### Feature

* Switch on / off.

* Control modes:

  - Change temperature between 17 - 30.
  - HEAT mode, COOL mode, AUTO mode support.
  - Sync AC State bewteen AC Partner and Home App.(Coming soon)
  - Wind force, Wind Swept support.(Coming sooooon)
  - Auto get your AC model.(may not work for all AC)
  - Customize IR Signal Support.(Coming sooooooooon)

* Customize your AC's Signal

### Installation

1. Install required packages(include miio).

```
npm install -g homebridge-mi-acpartner miio
```

2. Follow this [Document](https://github.com/aholstenson/miio/blob/master/docs/management.md#getting-the-token-of-a-device) to get your token of AC Partner.

   If you are using Android, you can get token of AC Partner by using MIJIA app.

3. Add following line to your config.json file

   Using Miio to discover your device and using preset AC command.

   Supported:
   - media: 1 
   - gree: 1,8,2(testing)

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
                "off": "You_AC_Signal_Here",
                "on": "Some_AC_need_this",
                "auto": "If no define, send cool signal instead",
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
  0.1.5
  Presets reconstruction. 

  0.1.2
  Fix gree no.1 preset cannot work.

  0.0.9
  Add auto mode support, code structure reconstruction, presets reconstruction.

  0.0.5
  Fix a problem that cannot send preset signal.

  0.0.4
  Fix a problem that customize signal cannot work.

  0.0.3
  Fix a problem that user cannot use presets.

  0.0.2
  Change Package.json to make Homebridge can run the plugin.

  0.0.1
  ADD Basic File.
