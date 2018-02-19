const presets = require('../presets.json');

/* INPUT_DATA
"data":{
  "model": "this.acModel",
  "power": "this.active",
  "SwingMode": "this.SwingMode",
  "RotationSpeed": "this.RotationSpeed",
  "TargetTemperature": "Characteristic",
  "TargetHeatingCoolingState": "Characteristic.TargetHeatingCoolingState.OFF@example",
  "defaultState": "Characteristic.TargetHeatingCoolingState"
}*/

module.exports = function (data) {
  var mainCode;
  if (!presets[data.model]) {
    mainCode = data.model + "pomowiswtta0";
  } else {
    mainCode = presets[data.model].main;
  }
  if (presets[data.model] && presets[data.model].off && data.TargetHeatingCoolingState == data.defaultState.OFF) {
    mainCode = presets[data.model].off;
  } else {
    var codeConfig = presets.default;
    var valueCont = presets.default.VALUE;
    var mode;

    /*Basic values */
    mainCode = mainCode.replace(/tt/g, parseInt(data.TargetTemperature).toString(16));
    if (data.power == null) {
      mainCode = mainCode.replace(/po/g, ((data.TargetHeatingCoolingState != data.defaultState.OFF) ? codeConfig.po.on : codeConfig.po.off));
    } else {
      mainCode = mainCode.replace(/po/g, data.power);
    }
    if (data.TargetHeatingCoolingState == data.defaultState.AUTO) {
      mode = codeConfig.mo.auto;
    } else if (data.TargetHeatingCoolingState == data.defaultState.HEAT) {
      mode = codeConfig.mo.heater;
    } else {
      mode = codeConfig.mo.cooler;
    }
    mainCode = mainCode.replace(/mo/g, mode);
    mainCode = mainCode.replace(/wi/g, !data.RotationSpeed ? codeConfig.wi.auto : data.RotationSpeed);
    mainCode = mainCode.replace(/sw/g, data.SwingMode ? codeConfig.sw.on : codeConfig.sw.off);
    mainCode = mainCode.replace(/li/g, codeConfig.li.on);

    /*Extra values */
    if (presets[data.model] && presets[data.model].EXTRA_VALUE) {
      codeConfig = presets[data.model];
      valueCont = presets[data.model].EXTRA_VALUE;
      for (var index = 0; index < valueCont.length; index++) {
        var tep = valueCont[index];
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
  */
  return mainCode;
}