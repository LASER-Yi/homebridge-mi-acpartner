/* INPUT_DATA
"data":{
  "model": "this.acModel",
  "power": "this.active",
  "swingMode": "this.swingMode",
  "RotationSpeed": "this.RotationSpeed",
  "TargetTemperature": "Characteristic",
  "TargetHeatingCoolingState": "Characteristic.TargetHeatingCoolingState.OFF@Example",
  "defaultState": "Characteristic.TargetHeatingCoolingState"
}*/

module.exports = function(data){
  var mainCode;
  var isAuto = false;
  var stoModel = null;
  if (!presets[data.model]) {
    mainCode = data.model + "pomowiswtta0";
    isAuto = true;
  }else{
    mainCode = presets[data.model].main;
    stoModel = presets[data.model].des;
  }
  if (presets[data.model] && presets[data.model].off && data.TargetHeatingCoolingState == data.defaultState.OFF) {
    mainCode = presets[data.model].off;
  }else{
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
          if (data.power == null) {
            mainCode = mainCode.replace(/po/g, ((data.TargetHeatingCoolingState != data.defaultState.OFF) ? codeConfig.po.on : codeConfig.po.off)); 
          }else{
            mainCode = mainCode.replace(/po/g, data.power);
          }
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
          mainCode = mainCode.replace(/wi/g, !data.RotationSpeed ? codeConfig.wi.auto : data.RotationSpeed);
          break;
        case "sw":
          mainCode = mainCode.replace(/sw/g, data.swing ? codeConfig.sw.on : codeConfig.sw.off);
          break;
        case "li":
          mainCode = mainCode.replace(/li/g, codeConfig.li.on);
          break;
        default:
          break;
      }
    }
  
    if (presets[data.model] && presets[data.model].EXTRA_VALUE) {
      codeConfig = presets[data.model];
      valueCont = presets[data.model].EXTRA_VALUE;
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
  data: "AC Code",
  auto: "Use auto_gen code"
  */
  return {
    data: mainCode,
    model: stoModel,
    auto: isAuto
  };
}