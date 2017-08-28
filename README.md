# homebridge-mi-acpartner
[![npm version](https://badge.fury.io/js/homebridge-mi-acpartner.svg)](https://badge.fury.io/js/homebridge-mi-acpartner)

[English Ver. Here](https://github.com/LASER-Yi/homebridge-mi-acpartner/blob/master/doc/README_EN.md#)


小米空调伴侣的Homebridge插件

感谢[takatost](https://github.com/takatost/homebridge-mi-ac-partner)，[miio](https://github.com/aholstenson/miio)，[YinHangCode](https://github.com/YinHangCode/homebridge-mi-aqara)和所有测试开发人员提供支持。

**注意：我没有很多时间去获取空调伴侣的预设信息，如果你手上有我没有提供的空调伴侣预设码，请前往[issues](https://github.com/LASER-Yi/homebridge-mi-acpartner/issues)或者直接发送邮件到ly0007@yeah.net提供。我需要空调30到17度制冷制热模式，各个模式任意温度和各种风力下的空调码。**

**注意：此插件在0.2.2版本后移除了Miio自动查找的功能，如果插件无法使用，请在"config.json"中添加你要控制的空调伴侣的IP地址。此插件在0.2.6版本后就开始使用自动查找预设功能，你可以在之后的版本放心移除"model"和"preset_no"字段。**


### Feature(功能）

* 开关空调

* 控制模式：

  - 使用空调码或红外码控制你的空调。
  - 在17-30度之间调整空调温度（默认情况）。
  - 制冷，制热，自动模式支持。
  - 改变风力，改变扫风状态。（即将于iOS 11中支持）
  - 自定义红外码以控制你的其他电器。（可能支持）

* 如果我们没有提供预设，可自定义你的空调码

* 在空调伴侣和Homekit中同步信息。~~(即将上线)~~

* 自动获取你的空调码。(并不支持所有空调)

* 米家温湿度传感器支持。~~(即将上线)~~


### Installation（安装）

1. 安装[Homebridge](https://github.com/nfarina/homebridge)

2. 安装此插件和依赖包(miio)

           npm install -g homebridge-mi-acpartner miio


3. 在**config.json**中加入你的配置信息，请参考下方的``Config``和``Config Example``添加

4. 启动Homebridge.

### Preset（预设）

此插件目前支持的预设：

    格力：1，2，8
    美的：1
    海尔：1
    奥克斯：1
    志高：1

请在米家App中更改预设信息

如果没有定义``customize``，其他空调会使用自动生成的空调码，不保证可用性。

如果你有预设信息，请于[issues](https://github.com/LASER-Yi/homebridge-mi-acpartner/issues)中分享给我，或者发送到我的电子邮箱中。

### Config（配置）

* 必要配置

    * "accessory": "XiaoMiAcPartner"

    * "token": "空调伴侣的token"

        参考这篇[文章](https://github.com/aholstenson/miio/blob/master/docs/management.md#getting-the-token-of-a-device)获得空调伴侣的token。

        如果你正使用安卓手机，你可以直接从米家App中拿到token

    * "name": "在家庭App中显示的名字（如添加多个空调伴侣，请确保此处互不相同）"

    * "ip": "空调伴侣在当前网络下的IP地址" 

* 可选配置

    * "customize":
        使用这种[方法](https://github.com/aholstenson/miio/blob/master/docs/protocol.md#)来获取你正使用的空调码，然后填入到这里。

            请参考Config Example填写。

            不是所有的空调都需要"on"信号，如果在调节温度时空调自动关机，则请填写相应信号到此处。

            如果"auto"信号没有定义，则会自动发送制冷信号。

            填入红外码，则会自动发送红外信号 [请注意关闭同步(sync)以免影响空调工作]

    * "maxTemp": "设置温度上限（默认为30度）"

    * "minTemp": "设置温度下限（默认为17度）"

    * "sync": "off" （关闭与空调伴侣的信息同步）

    * "autoStart": "off"（当在关机状态下调整温度时，不会自动启动空调）

    * "sensorSid": "填写你的**温湿度传感器**ID，此**温湿度传感器**必须绑定在空调伴侣下（可在安卓设备下查到）"

### Config Example（配置例子）

基本插件配置

```Json
"accessories": [
        {
            "accessory": "XiaoMiAcPartner",
            "token": "token-as-hex",
            "name": "AcPartner",
            "ip": "your_ac_partner_ip_address"
        }
    ]
```

使用外置温湿度传感器

```Json
"accessories": [
        {
            "accessory": "XiaoMiAcPartner",
            "token": "token-as-hex",
            "name": "AcPartner_1",
            "ip": "192.168.1.1",
            "sensorSid": "lumi.158d000156e667"
        }
]
```

使用自定义空调码或红外码

大部分空调码以01开头，且能与空调伴侣同步信息；大部分红外码以FE开头，能否同步信息未知

```json
"accessories": [
        {
            "accessory": "XiaoMiAcPartner",
            "token": "token-as-hex",
            "name": "AcPartner",
            "ip": "your_ac_partner_ip_address",
            "customize": {
                "off": "关闭信号（必须）",
                "on": "有些空调需要这个信号（可选）",
                "auto": "自动模式信号（可选）",
                "heat":{
                    "30": "（可选信号）",
                    "29": "",
                    "17": ""
                },
                "cool":{
                    "30": "（必要信号）",
                    "29": "",
                    "17": ""
                }
            }
        }
    ]
```

### Changelog

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
