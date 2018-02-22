# homebridge-mi-acpartner
[![npm version](https://badge.fury.io/js/homebridge-mi-acpartner.svg)](https://badge.fury.io/js/homebridge-mi-acpartner)

English Version | [中文版](https://github.com/LASER-Yi/homebridge-mi-acpartner/)

XiaoMi AC Partner plugins for HomeBridge.

Thanks for [takatost's project](https://github.com/takatost/homebridge-mi-ac-partner),  [miio](https://github.com/aholstenson/miio), [YinHangCode's project](https://github.com/YinHangCode/homebridge-mi-aqara) and all other developer and testers.

**WARN: This plugin change config.json structure after version 0.6.0, please change your config.json file.**

### Support

![AcPartner](https://github.com/LASER-Yi/homebridge-mi-acpartner/raw/master/img/two.jpg)

AC Partner v2 & AC Partner v1

### Feature

* Switch on / off.

* Control modes:

  - Use AC signal or IR signal to control your AC
  - Change temperature between 17 - 30(default state)
  - HEAT mode, COOL mode, AUTO mode support
  - Wind Speed, Swing Mode control support ~~(set type to 'heaterCooler')~~
  - Customize IR Signal to control other appliances

* Customize your AC's Signal if your AC doesn't response your command

* Sync AC State bewteen Mijia App and Home App

* Auto generate AC signal(Please see ``Preset``)

* Mijia Temperature Sensor Support


### Installation

1. Install [Homebridge](https://github.com/nfarina/homebridge)

2. Install this plugin

```
sudo npm install -g homebridge-mi-acpartner
```

3. Add this plugin configuration to your ``config.json`` file, please see ``Config`` and ``Config Example`` for more detail.

4. Start Homebridge.

### Preset

Support:

    Gree: 2,8
    Almost every no.1 AC preset in MIJIA app.

You can change your preset in MIJIA app.

If ``customize`` not define, this plugin will auto generate AC code. Your AC may not response your command.

### Config

**Global Config**

| parameter | description | required |
| --- | --- | --- |
| ``platform`` | “XiaoMiAcPartner" | * |
| ``devices`` | Define your AC Partner's **IP address** and **Token** here | * |

```Json
"platforms": [
        {
            "platform": "XiaoMiAcPartner",
            "devices":{
                "192.168.31.120":"your_token_here",
                "192.168.31.121":"your_token_here",
            },
            "accessories":[

            ]
        }
    ]
```

You can get your Partner's ip address and token in Mijia App.

**accessories**

*   climate(Basic AC function)

Recommand to this type to setup your AC

**Change wind speed, swing mode and LED state in Mijia App, these info will automatic sync back to this plugin.**

| parameter | description | example | default | required |
| --- | --- | --- | --- | --- |
| ``name`` | name show in Homekit | "AC Partner" | - | * |
| ``type`` | - | “climate" | - | * |
| ``deviceIp`` | IP address of this accessory | "192.168.31.120" | first IP address in "devices" |  |
| ``customize`` | Customize your AC signal | Example below |  |  |
| ``maxTemp`` | Set max temperature | 28 | 30 |  |
| ``minTemp`` | Set min temperature | 16 | 17 |  |
| ``syncInterval`` | "Sync interval(ms). Set to '0' will turn off sync function | 30000 | 60000 |  |
| ``autoStart`` | when AC turn off, change temperature will set to this mode. If you set this to "off", change temperature will not turn on AC. | "heat" | "cool" |  |
| ``sensorSid`` | Your Temperature Sensor Series ID, that sensor **must** connected to AC Partner. You can get this in Mijia App | "lumi.158d000156e667" |  |  |

If your AC doesn't response your command, you can use this [method](https://github.com/aholstenson/miio/blob/master/docs/protocol.md#) to get your AC Code and fill into config.json file.

Most AC command start with "01" and most IR command start with "FE". If you control your AC by using IR command, please turn off sync function.

```Json
"accessories":[
                {
                    "name": "Ac Partner",
                    "type": "climate",
                    "customize": {
                        "off": "off signal(required)",
                        "on": "some AC need this signal",
                        "auto": "auto mode",
                        "heat":{
                            "30": "heat mode signal",
                            "29": "",
                            "17": ""
                        },
                        "cool":{
                            "30": "cool mode signal(required)",
                            "29": "",
                            "17": ""
                        }
                    }
                }
            ]
```

*   heaterCooler（Beta）

You can directly change wind speed and swing mode in this type.

| parameter | description | example | default | required |
| --- | --- | --- | --- | --- |
| ``name`` | name show in Homekit | "AC Partner" | - | * |
| ``type`` | - | “climate" | - | * |
| ``deviceIp`` | IP address of this accessory | "192.168.31.120" | first IP address in "devices" |  |
| ``maxTemp`` | Set max temperature | 28 | 30 |  |
| ``minTemp`` | Set min temperature | 16 | 17 |  |
| ``syncInterval`` | "Sync interval(ms). Set to '0' will turn off sync function | 30000 | 60000 |  |
| ``autoStart`` | when AC turn off, change temperature will set to this mode. If you set this to "off", change temperature will not turn on AC. | "heat" | "cool" |  |
| ``sensorSid`` | Your Temperature Sensor Series ID, that sensor **must** connected to AC Partner. You can get this in Mijia App | "lumi.158d000156e667" |  |  |

**Note: This type don't support customize AC signal.**

```Json
"accessories":[
                {
                    "name": "AC Partner",
                    "type": "heaterCooler"
                }
            ]
```

*   learnIR (Learn IR code)

When switch open, AC Partner will receive IR signal for 30 seconds, and log to console.

| parameter | description | required |
| --- | --- | --- |
| ``name`` | name show in Homekit | * |
| ``type`` | "learnIR" | * |
| ``deviceIp`` | IP address of this accessory |  |

Please note that there's different between AC code and IR code.

*   switch(IR switch)

| parameter | description | required |
| --- | --- | --- |
| ``name`` | name show in Homekit | * |
| ``type`` | "switch" | * |
| ``deviceIp`` | IP address of this accessory |  |
| ``data`` | IR code send by this accessory, must include ``on`` and ``off`` | * |

```Json
"accessories":[
                {
                    "name": "ir_switch",
                    "type": "switch",
                    "data":{
                        "on": "FE018254234ON",
                        "off": "FE019205313OFF"
                    }
                }
            ]
```

*   switchRepeat(IR switch)

Send multi IR code in one switch

| parameter | description | required |
| --- | --- | --- |
| ``name`` | name show in Homekit | * |
| ``type`` | "switchRepeat" | * |
| ``deviceIp`` | IP address of this accessory |  |
| ``sendInterval`` | Send interval(default: 1000ms) |   |
| ``data`` | IR code send by this accessory, must include ``on`` and ``off`` | * |

```Json
"accessories":[
                {
                    "name": "repeat_switch",
                    "type": "switchRepeat",
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
                }
            ]
```

### Config Example

Single AC Partner

```Json
"platforms": [
        {
            "platform": "XiaoMiAcPartner",
            "devices":{
                "192.168.31.120":"your_token_here"
            },
            "accessories":[
                {
                    "name": "AC Partner",
                    "type": "climate"
                }
            ]
        }
    ]
```
Multi AC Partners

```Json
"platforms": [
        {
            "platform": "XiaoMiAcPartner",
            "devices":{
                "192.168.31.120":"your_token_here",
                "192.168.31.121":"your_token_here"
            },
            "accessories":[
                {
                    "name": "AC Partner 1",
                    "type": "climate",
                    "deviceIp":"192.168.31.120"
                },
                {
                    "name": "AC Partner 2",
                    "type": "climate",
                    "deviceIp":"192.168.31.121"
                }
            ]
        }
    ]
```

AC and IR learn switch

```Json
"platforms": [
        {
            "platform": "XiaoMiAcPartner",
            "devices":{
                "192.168.31.120":"your_token_here"
            },
            "accessories":[
                {
                    "name": "AC Partner",
                    "type": "climate"
                },
                {
                    "name": "learnir_switch",
                    "type": "learnIR"
                }
            ]
        }
    ]
```

AC and IR switch

```Json
"platforms": [
        {
            "platform": "XiaoMiAcPartner",
            "devices":{
                "192.168.31.120":"your_token_here"
            },
            "accessories":[
                {
                    "name": "AC Partner",
                    "type": "climate"
                },
                {
                    "name": "ir_switch",
                    "type": "switch",
                    "data":{
                        "on": "FE018254234ON",
                        "off": "FE019205313OFF"
                    }
                }
            ]
        }
    ]
```

AC and Repeat IR switch

```Json
"platforms": [
        {
            "platform": "XiaoMiAcPartner",
            "devices":{
                "192.168.31.120":"your_token_here"
            },
            "accessories":[
                {
                    "name": "AC Partner",
                    "type": "climate"
                },
                {
                    "name": "ir_switch",
                    "type": "switch",
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
                }
            ]
        }
    ]
```

### Changelog

0.6.1

Reconstruct almost every code

0.5.6

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


