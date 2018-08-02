# homebridge-mi-acpartner
[![npm version](https://badge.fury.io/js/homebridge-mi-acpartner.svg)](https://badge.fury.io/js/homebridge-mi-acpartner)

[English Version](./doc/README_EN.md#) | 中文版


小米空调伴侣的Homebridge插件

感谢[takatost](https://github.com/takatost/homebridge-mi-ac-partner)，[miio](https://github.com/aholstenson/miio)，[YinHangCode](https://github.com/YinHangCode/homebridge-mi-aqara)和所有测试开发人员提供支持。

**注意：此插件于0.6.0版本后修改了配置文件，请根据本文修改你的配置文件使插件正常工作。**

**若要查看抓包教程，请访问此项目Github的[Wiki页面](https://github.com/LASER-Yi/homebridge-mi-acpartner/wiki)**

### Support(支持)

![AcPartner](./img/two.jpg)

| 空调伴侣型号 | 功能 |
| --- | --- |
| 1代 & 2代 | 功能如下 |
| 3代（升级版） | 断路器开闭 |

如需要使用空调伴侣中的网关功能，请使用``YinHangCode``提供的[Homebridge-Mi-Aqara](https://github.com/YinHangCode/homebridge-mi-aqara)插件。

### Feature(功能）

* 开关空调

* 控制模式：

  - 使用空调码或红外码控制你的空调
  - 默认情况下，在17-30度之间调整空调温度
  - 更改空调模式：制冷，制热，自动模式
  - 改变风力和扫风状态。（请定义成``heaterCooler``）
  - 使用红外功能学习红外码，并控制其他电器

* 如果空调控制没有响应，可自定义你的空调码

* 同步米家App中的空调状态

* 自动生成空调码(请查看预设)

* 使用温湿度传感器显示温度和湿度


### Installation（安装）

1. 安装[Homebridge](https://github.com/nfarina/homebridge)

2. 安装此插件

稳定版

```
sudo npm install -g homebridge-mi-acpartner
```

测试版（可能落后稳定版进度）

```
sudo npm i -g homebridge-mi-acpartner@beta
```

3. 在**config.json**中加入你的配置信息，请参考下方的``Config``和``Config Example``

4. 启动Homebridge

### Preset（预设）

此插件目前支持的预设：

    格力：2，8
    大部分空调的1号预设

如果使用格力2的空调只有自动和关机响应，请尝试多次在制冷模式下调节温度让空调响应

你可以在米家App中更改预设信息

如果使用climate时没有定义``customize``，插件会使用自动生成的空调码，空调可能不会响应。

### Config（配置）

**全局配置**

| 参数 | 说明 | 必填 |
| --- | --- | --- |
| ``platform`` | “XiaoMiAcPartner" | * |
| ``devices`` | 此处写入空调伴侣的**IP地址**和**Token** | * |

```Json
"platforms": [
        {
            "platform": "XiaoMiAcPartner",
            "devices":{
                "192.168.31.120":"acpartner_token_here",
                "192.168.31.121":"acpartner_token_here"
            },
            "accessories":[

            ]
        }
    ]
```


空调绑定至米家后，可以在空调伴侣页面选择：

**关于 -> 然后点击空白部分数次 -> 网关信息**

即可看到空调伴侣的IP地址和Token

**设备配置**

*   climate（空调）

如果没有特别的需求，推荐使用这种类型来设定空调

**更改风速、扫风和灯光请使用米家App，更改后会自动同步到插件中**
    
| 参数 | 说明 | 示例 | 默认 | 必须 |
| --- | --- | --- | --- | --- |
| ``name`` | 显示在Homekit中的名字 | "AC Partner" | - | * |
| ``type`` | 必须填写 | "climate" | - | * |
| ``deviceIp`` | 空调伴侣的IP地址，只有单个空调伴侣无需填写 | "192.168.31.120" | 使用第一个填写的空调伴侣 |  |
| ``customize`` | 自定义空调伴侣发送信号 | 参考下方的插件配置使用 |  |  |
| ``maxTemp`` | 调节温度上限 | 28 | 30 |  |
| ``minTemp`` | 调节温度下限 | 16 | 17 |  |
| ``syncInterval`` | 同步间隔（毫秒），设置为0会关闭同步 | 30000 | 60000 |  |
| ``autoStart`` | 关机状态下调节温度时启动的模式，设置成"off"不会启动空调 | "heat" | "cool" |  |
| ``sensorSid`` | 填写你的温湿度传感器ID，此温湿度传感器**必须**绑定在空调伴侣下，可在米家空调伴侣中的**子设备信息**中查到 | "lumi.158d000156e667" |  |  |


如果空调没有响应，可以使用此[方法](https://github.com/LASER-Yi/homebridge-mi-acpartner/wiki)来获取你正使用的空调码，然后填入到config中。

大部分空调码以01开头，且能与空调伴侣同步信息；大部分红外码以FE开头，能否同步信息未知，所以在使用红外码控制空调时，请关闭插件的同步功能

```Json
"accessories":[
                {
                    "name": "Ac Partner",
                    "type": "climate",
                    "customize": {
                        "off": "关闭信号（必须）",
                        "on": "有些空调需要这个信号（可不填写）",
                        "auto": "自动模式信号（可不填写）",
                        "heat":{
                            "30": "（可不填写）",
                            "29": "",
                            "17": ""
                        },
                        "cool":{
                            "30": "（必须）",
                            "29": "",
                            "17": ""
                        }
                    }
                }
            ]
```

*   heaterCooler（空调）

可以更改风速和扫风模式的空调

**更改灯光请使用米家App，更改后会自动同步到插件中**
    
| 参数 | 说明 | 示例 | 默认 | 必须 |
| --- | --- | --- | --- | --- |
| ``name`` | 显示在Homekit中的名字 | "AcPartner" | - | * |
| ``type`` | 必须填写 | "heaterCooler" | - | * |
| ``deviceIp`` | 空调伴侣的IP地址，只有单个空调伴侣无需填写 | "192.168.31.120" | 使用第一个填写的空调伴侣 |  |
| ``maxTemp`` | 调节温度上限 | 28 | 30 |  |
| ``minTemp`` | 调节温度下限 | 16 | 17 |  |
| ``syncInterval`` | 同步间隔（毫秒），设置为0会关闭同步 | 30000 | 60000 |  |
| ``autoStart`` | 关机状态下调节温度时启动的模式，设置成"off"不会启动空调 | "heat" | "cool" |  |
| ``sensorSid`` | 填写你的温湿度传感器ID，此温湿度传感器**必须**绑定在空调伴侣下，可在米家空调伴侣中的**子设备信息**中查到 | "lumi.158d000156e667" |  |  |
| ``breaker`` | 第三代空调伴侣断路器支持 | true | false |  |

**注意：此方法不支持自定义空调码**

```Json
"accessories":[
                {
                    "name": "AC Partner",
                    "type": "heaterCooler"
                }
            ]
```

*   learnIR (红外学习开关)

打开开关后，使用遥控器向空调伴侣发送信号，30秒内接收到的红外信号会显示在日志中。

| 参数 | 说明 | 必须 |
| --- | --- | --- |
| ``name`` | 显示在Homekit中的名字 | * |
| ``type`` | "learnIR" | * |
| ``deviceIp`` | 空调伴侣的IP地址，只有单个空调伴侣无需填写 |  |

请注意空调码仍然需要自己抓包，且可以使用相同的方法抓到红外码

```Json
"accessories":[
                {
                    "name": "learnir_switch",
                    "type": "learnIR"
                }
            ]
```

*   switch（红外开关）

标准红外开关


| 参数 | 说明 | 必须 |
| --- | --- | --- |
| ``name`` | 显示在Homekit中的名字 | * |
| ``type`` | "switch" | * |
| ``deviceIp`` | 空调伴侣的IP地址，只有单个空调伴侣无需填写 |  |
| ``data`` | 发送的红外信号，必须要包含``on``和``off`` | * |

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

* switchRepeat (红外开关)

使用此开关可以在设定的间隔下连续发送红外信号

| 参数 | 说明 | 必须 |
| --- | --- | --- |
| ``name`` | 显示在Homekit中的名字 | * |
| ``type`` | "switchRepeat" | * |
| ``deviceIp`` | 空调伴侣的IP地址，只有单个空调伴侣无需填写 |   |
| ``sendInterval`` | 发送间隔，单位为ms（默认为200ms） |   |
| ``data`` | 发送的红外信号，必须要包含``on``和``off`` | * |

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

### Config Example（配置举例）

配置单个空调伴侣

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

配置多个空调伴侣
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

空调和红外学习开关

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

空调和开关

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

空调和多重红外开关

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

### Contribute



> #### 空调码分析，以格力2为例
> {0100010727}{1}{1}{0}{1}{1e}{1} 100190E20500210200040190E20700200001020
>
> {空调型号(10)} {电源状态(1)} {模式(1)} {风力(1)} {扫风状态(1)} {设定温度(2,16进制)} {灯光状态(1)} {校验位(直到结束)}
>
> [空调状态] – 和你在米家中选择的预设有关
>
> (电源状态) – 0为关；1为开
>
> (模式) – 0为制热；1为制冷；2为自动；3为除湿（Homekit不支持）；4为松风（Homekit不支持）
>
> (风力) – 0为低挡位；1为中档位；2为高档位；3为自动
>
> (扫风状态) – 0为开；1为关
>
> (设定温度) – Hex，为16进制
>
> (灯光状态) - 0为开，a或者1为关



**你可以以如下方式将码库增加到此插件中**

\#1

将空调设定为扫风和自动风，将抓到的空调码标注上温度和模式，发一个issue

这种空调码被标注为基础支持，即只支持调节温度和模式

\#2

抓取下列空调码：

* 每个模式不同风速空调码，如果没有发现具体规律可不用抓
* 每个模式不同扫风状态空调码，如果没有发现具体规律可不用抓
* 3种相同温度（如16，20，30）下不同的风速，扫风状态和模式

找到这些空调码的规律，发一个issue

这种空调码被标注为完全支持

---

以及，欢迎所有的Pull Requests

### Changelog

0.7.2

修改：

* 现在可以获取到断路器状态
* 增加了部分空调码的基础支持

0.7.1

修改：

* 使红外学习功能可用(感谢[python-miio](https://github.com/rytilahti/python-miio) #20)
* 给发送信号增加了1秒的延迟，避免同一时间发送太多信号使得空调伴侣崩溃(#40 #41)
* 支持第三代空调伴侣断路器

修复:

* 降级miio版本到0.14.1 (与Aqara冲突 #40)
* 修复格力2导致空调伴侣崩溃的问题 (#36 #33)
* 自定义空调码导致无响应的问题 （#41 #35)

BUG:

* 暂时无法获取断路器状态

0.7.0

修改:

* 更新miio版本到0.15.6
* 现在仅在设备成功连接上后，配件才会开始工作
* 现在调节温度时默认会启动制冷模式
* 修改同步锁解决多设备之间互相干扰的问题

修复:

* lockDrop导致EventEmit溢出(#36)

0.6.5

修复:
* 修复了没有绑定温度传感器时，温度信息持续显示为0的问题;
* 关闭同步时，首次启动同步后和米家中有出入(#29);

修改:

* 当空调伴侣的状态没有改变时，现在不会更新Homekit中的信息;


0.6.3

修复了空调伴侣信息同步到插件后显示不正确的问题

给格力2更换了预设信息

0.6.1

修复了自定义空调码不工作的问题

0.6.1-4

重构几乎所有代码

0.5.6

修复了一个导致climate无法工作的问题

0.5.4

修复BUG

0.5.1

修复部分配件无响应的问题（感谢qqshfox）

0.5.0

支持使用heaterCooler定义空调

0.4.4

可以设置红外学习开关和更多的开关类型

0.4.2

添加同步锁来解决多设备导致的问题

0.4.0

插件转移成Platform，支持基础的红外开关

0.3.0

支持自动重连，增加预设

0.2.9

支持湿度信息显示

0.2.8

支持深度自定义

0.2.7

支持连接到空调伴侣的温湿度传感器

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




