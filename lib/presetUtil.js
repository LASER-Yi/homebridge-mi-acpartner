/* INPUT_DATA
  "model": "origin model data get from AC sync function",
  "power": "this.Active",
  "mode": "mode must pre-convert to command",
  "tempera": "temperature basic on mode"
  "SwingMode": "this.SwingMode",
  "RotationSpeed": "this.RotationSpeed",
  "LightState": "this.LightState",
}*/
const presets = require('../presets.json');

module.exports = function (model, pw, md, tp, sw, rot, li) {
  let code;
  /**com_mode -> send command front  */
  let com_model = model.substr(0, 2) + model.substr(8, 8);

  if (presets[com_model]) {
    code = presets[com_model].main;
  } else {
    code = com_model + "pomowiswttli" + model.substr(-1);
  }

  /*Basic Value */
  let defaultConfig = presets['default']
  code = code.replace(/tt/g, parseInt(tp).toString(16));
  code = code.replace(/po/g, pw);
  code = code.replace(/mo/g, md);
  code = code.replace(/wi/g, rot);
  code = code.replace(/sw/g, sw ? defaultConfig.sw.on : defaultConfig.sw.off);
  code = code.replace(/li/g, li ? defaultConfig.li.on : defaultConfig.li.off);

  /*Extra Value */
  if (presets[model] && presets[model].EXTRA_VALUE) {
    presets[model].EXTRA_VALUE.forEach(element => {
      switch (element) {
        case "t0t":
          var temp = (parseInt(data.preset.t0t) + parseInt(data.tempera) - 17) % 16;
          code = code.replace(/t0t/g, temp.toString(16).toUpperCase());
          break;
        case "t6t":
          var temp = (parseInt(data.preset.t6t) + parseInt(data.tempera) - 17) % 16;
          code = code.replace(/t6t/g, temp.toString(16).toUpperCase());
          break;
        case "t4wt":
          var temp = (parseInt(data.preset.t4wt) + parseInt(data.tempera) - 17) % 16;
          code = code.replace(/t4wt/g, temp.toString(16).toUpperCase());
          break;
      }
    });
  }
  return code;
}