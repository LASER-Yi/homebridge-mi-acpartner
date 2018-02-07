# homebridge-mi-acpartner
[![npm version](https://badge.fury.io/js/homebridge-mi-acpartner.svg)](https://badge.fury.io/js/homebridge-mi-acpartner)

[English Ver. Here](https://github.com/LASER-Yi/homebridge-mi-acpartner/blob/master/doc/README_EN.md#)


小米空调伴侣的Homebridge插件

感谢[takatost](https://github.com/takatost/homebridge-mi-ac-partner)，[miio](https://github.com/aholstenson/miio)，[YinHangCode](https://github.com/YinHangCode/homebridge-mi-aqara)和所有测试开发人员提供支持。

**注意：此插件于0.4.0版本后修改成platform，请根据本文修改你的配置文件以保证插件可用。**

### Support(支持)

![AcPartner](https://github.com/LASER-Yi/homebridge-mi-acpartner/raw/master/img/two.jpg)

空调伴侣2代 & 空调伴侣1代

### Feature(功能）

* 开关空调

* 控制模式：

  - 使用空调码或红外码控制你的空调。
  - 在17-30度之间调整空调温度（默认情况）。
  - 制冷，制热，自动模式支持。
  - 改变风力，改变扫风状态。（请将空调定义成heaterCooler）
  - 自定义红外码以控制你的其他电器。~~（即将上线）~~

* 如果我们没有提供预设，可自定义你的空调码

* 在空调伴侣和Homekit中同步信息。~~(即将上线)~~

* 自动获取你的空调码。(并不支持所有空调)

* 米家温湿度传感器支持。~~(即将上线)~~


### Installation（安装）

1. 安装[Homebridge](https://github.com/nfarina/homebridge)

2. 安装此插件和依赖包(miio)

           npm install -g  homebridge-mi-acpartner miio


3. 在**config.json**中加入你的配置信息，请参考下方的``Config``和``Config Example``添加

4. 启动Homebridge.

### Preset（预设）

此插件目前支持的预设：

    格力：1，2，8
    大部分空调的1号预设

你可以在米家App中更改预设信息

如果没有定义``customize``，其他空调会使用自动生成的空调码，不保证可用性。

如果你有预设信息，请于[issues](https://github.com/LASER-Yi/homebridge-mi-acpartner/issues)中分享给我。

### Config（配置）

**全局配置**

| 参数 | 说明 | 必填 |
| --- | --- | --- |
| ``platform`` | “XiaoMiAcPartner" | * |
| ``ip`` | 你空调伴侣的IP地址，下方设备(accessories)中没有填写ip的均使用本ip设置 |  |
| ``token`` | 你空调伴侣的token，下方设备(accessories)中没有填写token的均使用本token设置 |  |


参考这篇[文章](https://github.com/aholstenson/miio/blob/master/docs/management.md#getting-the-token-of-a-device)获得空调伴侣的token。

如果你正使用安卓手机，你可以直接从米家App中拿到token

**设备配置**

*   climate（空调）

    
| 参数 | 说明 | 示例 | 默认 | 必须 |
| --- | --- | --- | --- | --- |
| ``name`` | 显示在Homekit中的名字 | "AcPartner" | - | * |
| ``type`` | 设置为，必须填写 | "climate" | - | * |
| ``ip`` | 你空调伴侣的IP地址，此处没有填写ip均使用上方全局ip设置| "192.168.31.99" | - |  |
| ``token`` | 你空调伴侣的token，此处没有填写token均使用上方全局token设置 | "token_as_hex" | - |  |
| ``maxTemp`` | 设置调节温度上限 | 28 | 30 |  |
| ``minTemp`` | 设置调节温度下限 | 16 | 17 |  |
| ``sync`` | 是否与空调伴侣进行同步(false为关闭） | false | true |  |
| ``syncInterval`` | 同步间隔（毫秒） | 30000 | 60000 |  |
| ``autoStart`` | 当在关机状态下调整温度时，不会自动启动空调 | "off" | "on" |  |
| ``oscillate`` | 开关扫风（false为关闭） | false | true |  |
| ``sensorSid`` | 填写你的温湿度传感器ID，此温湿度传感器**必须**绑定在空调伴侣下（可在安卓设备下查到）| "lumi.158d000156e667" |  |  |


使用这种[方法](https://github.com/aholstenson/miio/blob/master/docs/protocol.md#)来获取你正使用的空调码，然后填入到config，填写方法请参考Config Example。

*   heaterCooler（Beta）

可以更改风力和扫风的空调，还处于测试阶段
    
| 参数 | 说明 | 示例 | 默认 | 必须 |
| --- | --- | --- | --- | --- |
| ``name`` | 显示在Homekit中的名字 | "AcPartner" | - | * |
| ``type`` | 设置为，必须填写 | "heaterCooler" | - | * |
| ``ip`` | 你空调伴侣的IP地址，此处没有填写ip均使用上方全局ip设置| "192.168.31.99" | - |  |
| ``token`` | 你空调伴侣的token，此处没有填写token均使用上方全局token设置 | "token_as_hex" | - |  |
| ``maxTemp`` | 设置调节温度上限 | 28 | 30 |  |
| ``minTemp`` | 设置调节温度下限 | 16 | 17 |  |
| ``syncInterval`` | 同步间隔（毫秒），设置为0关闭同步 | 30000 | 60000 |  |
| ``autoStart`` | 当在关机状态下调整温度时，不会自动启动空调 | "off" | "on" |  |
| ``sensorSid`` | 填写你的温湿度传感器ID，此温湿度传感器**必须**绑定在空调伴侣下（可在安卓设备下查到）| "lumi.158d000156e667" |  |  |

*   learnIR (红外学习开关)

| 参数 | 说明 | 必须 |
| --- | --- | --- |
| ``name`` | 显示在Homekit中的名字 | * |
| ``type`` | "learnIR" | * |
| ``ip`` | 你空调伴侣的IP地址，此处没有填写ip均使用上方全局ip设置 |  |
| ``token`` | 你空调伴侣的token，此处没有填写token均使用上方全局token设置 |  |

打开开关后，直接使用遥控器向空调伴侣发送信号，30秒内接收到的红外信号会直接显示在日志中。

请注意空调码仍然需要自己抓包，且空调码和红外码是有区别的。

*   switch（红外开关）


| 参数 | 说明 | 必须 |
| --- | --- | --- |
| ``name`` | 显示在Homekit中的名字 | * |
| ``type`` | "switch" | * |
| ``ip`` | 你空调伴侣的IP地址，此处没有填写ip均使用上方全局ip设置 |  |
| ``token`` | 你空调伴侣的token，此处没有填写token均使用上方全局token设置 |  |
| ``data`` | 请参考``Config Example``,必须要包含``on``和``off`` | * |

* switchMulti (多重信号红外开关)

| 参数 | 说明 | 必须 |
| --- | --- | --- |
| ``name`` | 显示在Homekit中的名字 | * |
| ``type`` | "switchMulti" | * |
| ``ip`` | 你空调伴侣的IP地址，此处没有填写ip均使用上方全局ip设置 |  |
| ``token`` | 你空调伴侣的token，此处没有填写token均使用上方全局token设置 |  |
| ``interval`` | 发送延时，单位为毫秒（默认1000） |   |
| ``data`` | 请参考``Config Example``,必须要包含``on``和``off`` | * |

### Config Example（配置例子）

基本插件配置

```Json
"platforms": [
        {
            "platform": "XiaoMiAcPartner",
            "ip": "your_ac_partner_ip",
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

也可以写成这样

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

加入空调和红外学习开关

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

加入空调和开关

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

空调和多重信号开关

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

使用外置温湿度传感器

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

使用自定义空调码或红外码

大部分空调码以01开头，且能与空调伴侣同步信息；大部分红外码以FE开头，能否同步信息未知

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
        }
    ]
```

### Changelog

0.5.3

修复HeaterCooler类型中的大量BUG

0.5.1

修复部分配件无响应的问题（感谢qqshfox）

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




