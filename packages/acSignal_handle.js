var presets = require('../presets.json');

/* INPUT_DATA
"data":{
  "model": "config_model",
  "preset_no": "config_num",
  "LastHeatingCoolingState": "this.LastHeatingCoolingState"
  "CurrentTemperature": "Characteristic",
  "TargetTemperature": "Characteristic",
  "TargetHeatingCoolingState": "Characteristic.TargetHeatingCoolingState.OFF@example",
  "defaultState": "Characteristic.TargetHeatingCoolingState"
}*/

module.exports = function(data){
  if (!data.model && !data.preset_no) {
    return;
  }

  if (presets[data.model][data.preset_no].off && data.TargetHeatingCoolingState == data.defaultState.OFF) {
    var mainCode = presets[data.model][data.preset_no].off;
  }else{
    if (data.autoModel) {
      var mainCode = data.autoModel+"pomowiswtt02"
    }else{
      var mainCode = presets[data.model][data.preset_no].main;
    }
    var codeConfig = presets.default;
    var valueCont = presets.default.VALUE;
    for (var index = 0; index < valueCont.length; index++) {
      var tep = valueCont[index];//default replacement
      switch (tep) {
        case "tt":
          var temp = parseInt(data.TargetTemperature).toString(16);
          mainCode = mainCode.replace(/tt/g, temp);
          break;
        case "po":
          mainCode = mainCode.replace(/po/g, ((data.TargetHeatingCoolingState != data.defaultState.OFF) ? codeConfig.po.on : codeConfig.po.off));
          break;
        case "mo":
          var mode;
          if(data.TargetHeatingCoolingState == data.defaultState.AUTO){
            mode = codeConfig.mo.auto;
          }else if(data.TargetHeatingCoolingState == data.defaultState.HEAT){
            mode = codeConfig.mo.heater;
          }else{
            mode = codeConfig.mo.cooler;
          }
          mainCode = mainCode.replace(/mo/g, mode);
          break;
        case "wi":
          mainCode = mainCode.replace(/wi/g, codeConfig.wi.auto);
          break;
        case "sw":
          mainCode = mainCode.replace(/sw/g, codeConfig.sw.on);
          break;
        case "li":
          mainCode = mainCode.replace(/li/g, codeConfig.li.on);
          break;
        default:
          break;
      }
    }
  
    if (!data.autoModel && presets[data.model][data.preset_no].EXTRA_VALUE) {
      codeConfig = presets[data.model][data.preset_no];
      valueCont = presets[data.model][data.preset_no].EXTRA_VALUE;
      for (var index = 0; index < valueCont.length; index++) {
        var tep = valueCont[index];//extra replacement
        switch (tep) {
          case "t0t":
            var temp = (parseInt(codeConfig.t0t) + parseInt(data.TargetTemperature) - 17) % 16;
            mainCode = mainCode.replace(/t0t/g, temp.toString(16).toUpperCase());
            break;
          case "t6t":
            var temp = (parseInt(codeConfig.t6t) + parseInt(data.TargetTemperature) - 17) % 16;
            mainCode = mainCode.replace(/t6t/g, temp.toString(16).toUpperCase());
            break;
          case "t4wt":
            var temp = (parseInt(codeConfig.t4wt) + parseInt(data.TargetTemperature) - 17) % 16;
            mainCode = mainCode.replace(/t4wt/g, temp.toString(16).toUpperCase());
            break;
          default:
            break;
        }
      }
    }
  }

  /* RETURN_DATA
  data: "AC Code"
  */

  return {
    data: mainCode
  };
}