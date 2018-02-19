# homebridge-mi-acpartner
[![npm version](https://badge.fury.io/js/homebridge-mi-acpartner.svg)](https://badge.fury.io/js/homebridge-mi-acpartner)

XiaoMi AC Partner plugins for HomeBridge.

Thanks for [takatost's project](https://github.com/takatost/homebridge-mi-ac-partner),  [miio](https://github.com/aholstenson/miio), [YinHangCode's project](https://github.com/YinHangCode/homebridge-mi-aqara) and all other developer and testers.

**WARN: This plugin change to platform after version 0.4.0, please change your config file basic on config and config example.**

### Support

![AcPartner](https://github.com/LASER-Yi/homebridge-mi-acpartner/raw/master/img/two.jpg)

AC Partner v1 & AC Partner v2

### Feature

* Switch on / off.

* Control modes:

  - Use AC signal or IR signal to control your AC.
  - Change temperature between 17 - 30(default).
  - HEAT mode, COOL mode, AUTO mode support.
  - Wind Force, Swing Mode control support.~~(Basic on iOS 11, Coming sooooon)~~
  - Customize IR Signal Support.~~(Coming sooooooooon)~~

* Customize your AC's Signal

* Sync AC State bewteen AC Partner and Home App.~~(Coming soon)~~

* Auto get AC signal.(may not work for all AC)

* Temperature Sensor Support.~~(Coming soon)~~


### Installation

1. Install [Homebridge](https://github.com/nfarina/homebridge)

2. Install required packages(include miio).

```
npm install -g homebridge-mi-acpartner miio
```

3. Add plugin configuration to your config.json file, please see ``Config`` and ``Config Example`` for more detail.

4. Start Homebridge.

### Preset

Support:

    Gree: 1,2,8
    Almost any no.1 presets in MIJIA app.

You can change your preset in MIJIA app.

If ``customize`` not exist and we don't support your AC, this plugin will auto generate AC code. 

If you have preset infomation ,you can share with me in [issues](https://github.com/LASER-Yi/homebridge-mi-acpartner/issues).

### Config

**Global Config**

| parameter | description | required |
| --- | --- | --- |
| ``platform`` | “XiaoMiAcPartner" | * |
| ``ip`` | Your AC Partner ip address in GLOBAL |  |
| ``token`` | Your AC Partner token in GLOBAL |  |

Please Follow this [document](https://github.com/aholstenson/miio/blob/master/docs/management.md#getting-the-token-of-a-device) to get your AC Parnter's token.


**accessories**

*   heaterCooler（Beta）

可以更改风力和扫风的空调，还处于测试阶段
    
| parameter | description | example | default | required |
| --- | --- | --- | --- | --- |
| ``name`` | name show in Homekit | "AcPartner" | - | * |
| ``type`` |  | "heaterCooler" | - | * |
| ``ip`` | Your AC Partner ip address for this accessory | "192.168.31.99" | - |  |
| ``token`` | Your AC Partner token for this accessory | "token_as_hex" | - |  |
| ``maxTemp`` | Set max temperature | 28 | 30 |  |
| ``minTemp`` | Set min temperature | 16 | 17 |  |
| ``syncInterval`` | "Sync interval(ms). Set to '0' to turn off sync function | 30000 | 60000 |  |
| ``sensorSid`` | Your Temperature Sensor Series ID, that sensor **must** connected to AC Partner | "lumi.158d000156e667" |  |  |

*   climate(Basic partner function)

| parameter | description | required(default value) |
| --- | --- | --- |
| ``name`` | name show in Homekit | * |
| ``type`` | “climate" | * |
| ``ip`` | Your AC Partner ip address for this accessory |  |
| ``token`` | Your AC Partner token for this accessory |  |
| ``maxTemp`` | Set max temperature | 28 |
| ``minTemp`` | Set min temperature | 16 |
| ``syncInterval`` | "Sync interval(ms). Set to '0' to turn off sync function | 60000 |
| ``autoStart`` | "off" (When AC is off, change temperature will not turn on AC) | "off" |
| ``SwingMode`` | Change AC Swing mode | true |
| ``sensorSid`` | Your Temperature Sensor Series ID, that sensor **must** connected to AC Partner |  |

*   learnIR (Learn IR code)

| parameter | description | required |
| --- | --- | --- |
| ``name`` | name show in Homekit | * |
| ``type`` | "learnIR" | * |
| ``ip`` | Your AC Partner ip address for this accessory |  |
| ``token`` | Your AC Partner token for this accessory |  |

When switch open, AC Partner will receive IR signal for 30 seconds, and log in console.

Please note that there's different between AC code and IR code.

*   switch(IR)

| parameter | description | required |
| --- | --- | --- |
| ``name`` | name show in Homekit | * |
| ``type`` | "switch" | * |
| ``ip`` | Your AC Partner ip address for this accessory |  |
| ``token`` | Your AC Partner token for this accessory |  |
| ``data`` | Follow ``Config Example``, must include ``on`` and ``off`` | * |

*   switchMulti(Send multi IR code in one switch)

| parameter | description | required |
| --- | --- | --- |
| ``name`` | name show in Homekit | * |
| ``type`` | "switch" | * |
| ``ip`` | Your AC Partner ip address for this accessory |  |
| ``token`` | Your AC Partner token for this accessory |  |
| ``interval`` | Send interval(default: 1000) |   |
| ``data`` | Follow ``Config Example``, must include ``on`` and ``off`` | * |

### Config Example

Basic setting

```Json
"platforms": [
        {
            "platform": "XiaoMiAcPartner",
            "ip": "your_ac_partner_token",
            "token": "your_ac_partner_token",
            "accessories":[
                {
                    "name": "Ac Partner",
                    "type": "climate"
                }
            ]
        }
    ]
```

You can also write like this

```Json
"platforms": [
        {
            "platform": "XiaoMiAcPartner",
            "accessories":[
                {
                    "name": "Ac Partner",
                    "type": "climate",
                    "ip": "your_ac_partner_token",
                    "token": "your_ac_partner_token"
                }
            ]
        }
    ]
```

Add AC and Learn switch

```Json
"platforms": [
        {
            "platform": "XiaoMiAcPartner",
            "ip": "AC_Partner_1",
            "token": "AC_Partner_1_token",
            "accessories":[
                {
                    "name": "learn",
                    "type": "learnIR"
                },{
                    "name": "Ac Partner",
                    "type": "climate",
                    "ip":"AC_Partner_2",
                    "token":"AC_Partner_2_token"
                }
            ]
        }
    ]
```

Add AC and IR switch

```Json
"platforms": [
        {
            "platform": "XiaoMiAcPartner",
            "ip": "AC_Partner_1",
            "token": "AC_Partner_1_token",
            "accessories":[
                {
                    "name": "test",
                    "type": "switch",
                    "data":{
                        "on": "FE018254234ON",
                        "off": "FE019205313OFF"
                    }
                },{
                    "name": "Ac Partner",
                    "type": "climate",
                    "ip":"AC_Partner_2",
                    "token":"AC_Partner_2_token"
                }
            ]
        }
    ]
```

Add AC and switchMulti

```Json
"platforms": [
        {
            "platform": "XiaoMiAcPartner",
            "ip": "AC_Partner_1",
            "token": "AC_Partner_1_token",
            "accessories":[
                {
                    "name": "test",
                    "type": "switchMulti",
                    "interval": 1500,
                    "data":{
                        "on": [
                            "FE.....",
                            "FE......",
                            "FE......"
                        ],
                        "off": [
                            "FE.....",
                            "FE......"
                        ]
                    }
                },{
                    "name": "Ac Partner",
                    "type": "climate",
                    "ip":"AC_Partner_2",
                    "token":"AC_Partner_2_token"
                }
            ]
        }
    ]
```

Use outer Temperature Sensor

```Json
"platforms": [
        {
            "platform": "XiaoMiAcPartner",
            "ip": "your_ac_partner_token",
            "token": "your_ac_partner_token",
            "accessories":[
                {
                    "name": "Ac Partner",
                    "type": "climate",
                    "sensorSid": "lumi.158d000156e667"
                }
            ]
        }
    ]
```

Using customize AC command or IR command.

Most AC command start with "01" and most IR command start with "FE"

```Json
"platforms": [
        {
            "platform": "XiaoMiAcPartner",
            "ip": "your_ac_partner_token",
            "token": "your_ac_partner_token",
            "accessories":[
                {
                    "name": "Ac Partner",
                    "type": "climate",
                    "customize": {
                        "off": "off signal (required)",
                        "on": "(optional)",
                        "auto": "auto mode signal (optional)",
                        "heat":{
                            "30": "（optional）",
                            "29": "",
                            "17": ""
                        },
                        "cool":{
                            "30": "(required)",
                            "29": "",
                            "17": ""
                        }
                    }
                }
            ]
        }
    ]
```

### Changelog

0.5.6

修复了一个导致Climate无法工作的问题
Fix a problem cause climate crash

0.5.4

BUG fix

0.5.1

Fix no respnose for some accessories

0.5.0

Support Heater Cooler for AC

0.4.4

IR Learner and switchMulti support

0.4.2

add synclock to support multi-device problem

0.4.0

Change to Platform,support basic IR switch

0.3.0

Auto reconnect support, add presets

0.2.9

Relative Humidity data support.

0.2.8

Deeper customize support

0.2.7

Temperature sensor that connected with AC Partner support.

0.2.6

Remove Gateway temperature sensor support. Add automatic preset detection.

0.2.5

Outer temperature sensor support. 

0.2.3

Gree 2 preset support, customize IR control support.

0.2.0

Sync State between hk and AC Partner. maxTemp & minTemp Support. Add gree 2 preset for testing.

0.1.5

Presets reconstruction.

0.0.9

Auto mode support, "on" signal support, code reconstruction, presets reconstruction.

0.0.1

ADD Basic File.


