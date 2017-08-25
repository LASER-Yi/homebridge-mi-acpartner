var presets = require('../presets.json');

/* INPUT_DATA
"data":{
  "autoModel": "when model == auto",
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

  if (data.autoModel) {
    var mainCode = data.autoModel+"pomowiswtt02"
  }else{
    var mainCode = presets[data.model][data.preset_no].main;
  }
  var codeConfig = presets.default;
  var valueCont = presets.default.VALUE;
  for (var index = 0; index < valueCont.length; index++) {
    var tep = valueCont[index];//default replacement
    if (tep == "tt") {
      var temp = parseInt(data.TargetTemperature).toString(16);
      mainCode = mainCode.replace(/tt/g, temp);
    }else if (tep == "po") {
      mainCode = mainCode.replace(/po/g, ((data.TargetHeatingCoolingState != data.defaultState.OFF) ? codeConfig.po.on : codeConfig.po.off));
    }else if (tep == "mo") {
      var mode;
      if(data.TargetHeatingCoolingState == data.defaultState.AUTO){
        mode = codeConfig.mo.auto;
      }else if(data.TargetHeatingCoolingState == data.defaultState.HEAT){
        mode = codeConfig.mo.heater;
      }else{
        mode = codeConfig.mo.cooler;
      }
      mainCode = mainCode.replace(/mo/g, mode);
    }else if (tep == "wi") {
      mainCode = mainCode.replace(/wi/g, codeConfig.wi.auto);
    }else if (tep == "sw") {
      mainCode = mainCode.replace(/sw/g, codeConfig.sw.on);
    }else if (tep == "li") {
      mainCode = mainCode.replace(/li/g, codeConfig.li.on);
    }
  }

  if (!data.autoModel && presets[data.model][data.preset_no].EXTRA_VALUE) {
    codeConfig = presets[data.model][data.preset_no];
    valueCont = presets[data.model][data.preset_no].EXTRA_VALUE;
    for (var index = 0; index < valueCont.length; index++) {
      var tep = valueCont[index];//extra replacement
      if (tep == "t6t") {
        var temp = (parseInt(codeConfig.t6t) + parseInt(data.TargetTemperature)).toString(16);
        mainCode = mainCode.replace(/t6t/g, temp);
      }else if (tep == "t4wt") {
        var temp = (parseInt(codeConfig.t4wt) + parseInt(data.TargetTemperature)).toString(16);
        mainCode = mainCode.replace(/t4wt/g, temp);
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