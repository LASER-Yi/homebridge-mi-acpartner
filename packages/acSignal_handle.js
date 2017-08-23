var presets = require('../presets.json');

/* INPUT_DATA
"data":{
  "model": "config_model",
  "preset_no": "config_num",
  "CurrentTemperature": "Characteristic",
  "TargetTemperature": "Characteristic",
  "TargetHeatingCoolingState": "Characteristic.TargetHeatingCoolingState.OFF@example",
  "defaultState": "Characteristic.TargetHeatingCoolingState"
}*/

module.exports = function(data){
  if (!data.model||!data.preset_no) {
    return;
  }

  var mainCode = presets[data.model][data.preset_no].main;
  var codeConfig = presets[data.model][data.preset_no];
  var valueCont = presets[data.model][data.preset_no].VALUE;
  for (var index = 0; index < valueCont.length; index++) {
    var tep = valueCont[index];
    if (tep == "tt") {
      var temp = (parseInt(codeConfig.tt) + parseInt(data.TargetTemperature) - 17)%16;
      mainCode = mainCode.replace(/tt/g, temp.toString(16));
    }else if (tep == "p") {
      mainCode = mainCode.replace(/p/g, ((data.TargetHeatingCoolingState != data.defaultState.OFF) ? codeConfig.p.on : codeConfig.p.off));
    }else if (tep == "m") {
      var mode;
      if(data.TargetHeatingCoolingState == data.defaultState.AUTO){
        if(codeConfig.m.auto){
          mode = codeConfig.m.auto;
        }else{
          mode = codeConfig.m.cooler;
        }
      }else if(data.TargetHeatingCoolingState == data.defaultState.HEAT){
        mode = codeConfig.m.heater;
      }else{
        mode = codeConfig.m.cooler;
      }
      mainCode = mainCode.replace(/m/g, mode);
    }else if (tep == "w") {
      //uncomplete
      mainCode = mainCode.replace(/w/g, codeConfig.w);
    }
  }

  return {
    data: mainCode
  };
}