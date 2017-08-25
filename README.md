# homebridge-mi-acpartner
[![npm version](https://badge.fury.io/js/homebridge-mi-acpartner.svg)](https://badge.fury.io/js/homebridge-mi-acpartner)

XiaoMi AC Partner plugins for HomeBridge.

Thanks for [takatost's project](https://github.com/takatost/homebridge-mi-ac-partner),  [miio](https://github.com/aholstenson/miio) and all other developer and testers.

**Note: I don't have much time to get AC command for presets. You can commit your customize setting to [issues](https://github.com/LASER-Yi/homebridge-mi-acpartner/issues) or ly0007@yeah.net. I will write a Commit Format later.**

**WARN: This plugin will not support Miio Auto Discover feature after 0.2.2. Please add your ac partner's ip address to config.json as quick as possible, Thanks.**

### Feature

* Switch on / off.

* Control modes:

  - Change temperature between 17 - 30(default).
  - HEAT mode, COOL mode, AUTO mode support.
  - Wind Force, Wind Sweep control support.(Basic on iOS 11, Coming sooooon)
  - Customize IR Signal Support.(Coming sooooooooon)

* Customize your AC's Signal

* Sync AC State bewteen AC Partner and Home App.~~(Coming soon)~~

* Auto get AC signal.(may not work for all AC)

* Lumi Gateway Temperature Sensor Support.(Coming soon)


### Installation

1. Install [Homebridge](https://github.com/nfarina/homebridge)

2. Install required packages(include miio).

```
npm install -g homebridge-mi-acpartner miio
```

3. Add plugin configuration to your config.json file, please see ``Config`` and ``Config Example`` for more detail.

4. Start Homebridge.

### Config

* Necessary

    * "accessory": "XiaoMiAcPartner"

    * "token": "Your AC Partner token"

      Follow this [Document](https://github.com/aholstenson/miio/blob/master/docs/management.md#getting-the-token-of-a-device) get your AC Partner's token.

            If you are using Android device, you can get token by using MIJIA app.

    * "name": "Name show in Home App"

    * "ip": "your_ac_partner_ip_address"

    1. "brand": "Your AC brand",

        "preset_no": "Preset No. in MIJIA App"

            Support:

                - media: 1 

                - gree: 1,8

            Testing:

                - gree: 2

    2. "customize":
       Use this [method](https://github.com/aholstenson/miio/blob/master/docs/protocol.md#) to get your AC's command.

             Please see Config Example for more detail.

             Not every AC need "on" signal, please check your AC's command for more infomation.

             If "auto" signal undefined, plugin will send signal(cool/heat) basic on current temperature.

    **You must choose one method(preset or customize) to control your AC.**


* Optional

    * "maxTemp": "Set max temperature"

    * "minTemp": "Set min temperature"

### Config Example

Using preset AC command.

```
"accessories": [
        {
            "accessory": "XiaoMiAcPartner",
            "token": "token-as-hex",
            "name": "AcPartner",
            "ip": "your_ac_partner_ip_address",
            "brand": "media",
            "preset_no": "1"
        }
    ]
```

Using customize AC command.

```
"accessories": [
        {
            "accessory": "XiaoMiAcPartner",
            "token": "token-as-hex",
            "name": "AcPartner",
            "minTemp": "18",
            "ip": "your_ac_partner_ip_address",
            "customize": {
                "off": "AC off signal(Necessary)",
                "on": "Some_AC_need_this(Optional)",
                "auto": "AC auto mode signal(Optional)",
                "heat":{
                    "30": "(Optional)",
                    "29": "",
                    "17": ""
                },
                "cool":{
                    "30": "Necessary",
                    "29": "",
                    "17": ""
                }
            }
        }
    ]
```

### Changelog
  0.2.0

  Sync State between hk and AC Partner. maxTemp & minTemp Support. Add gree 2 preset for testing.

  0.1.5

  Presets reconstruction.

  0.0.9

  Auto mode support, "on" signal support, code reconstruction, presets reconstruction.

  0.0.1
  ADD Basic File.
