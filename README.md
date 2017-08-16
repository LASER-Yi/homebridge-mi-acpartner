# homebridge-mi-acPartner
[![npm version](https://badge.fury.io/js/homebridge-mi-acpartner.svg)](https://badge.fury.io/js/homebridge-mi-acpartner)

A homebridge plugin for xiaomi AC Partner.

Basic on [takatost's project]("https://github.com/takatost/homebridge-mi-ac-partner") and [miio]("https://github.com/aholstenson/miio"),**thanks**.

This plugin is developing now, may cause some crush problem. 

# Feature

* Switch on / off.

* Control modes:

  - Lift ac partner temperature between 17 - 30. 
  
* Customize your IR Signal
  
### Installation

1. Install required packages(include miio).

   ```
   npm install -g homebridge-mi-acpartner miio
   ```
   
2. Follow this [Document](https://github.com/aholstenson/miio/blob/master/docs/management.md#getting-the-token-of-a-device) to get your token of AC Partner.
   
   If you are using Android, you can get token of AC Partner by using MIJIA app.
   
4. In you router, change the IP of AC Partner to static(If miio can easily regonize your device,this step is no longer need) 
   
3. Add following line to your `config.json` file
  
  ```
  "accessories": [
        {
            "accessory": "XiaoMiAcPartner",
            "token": "token-as-hex",
            "name": "AcPartner",
            "brand": "media",
            "preset_no": "1"
        },
        {
            "accessory": "XiaoMiAcPartner",
            "token": "token-as-hex",
            "name": "AcPartner",
            "ip": "your_ac_partner_ip_address",
            "customize": {
                "off":"You IR Signal Here",
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
    
 4. Restart Homebridge.
