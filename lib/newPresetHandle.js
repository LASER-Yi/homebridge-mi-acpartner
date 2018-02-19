/* INPUT_DATA
"data":{
  "defaultPresets": "presets.default"
  "preset": "this.preset",
  "model": "this.model",
  "power": "this.Active",
  "mode": "mode must pre-convert to AC code",
  "tempera": "temperature basic on mode"
  "SwingMode": "this.SwingMode",
  "RotationSpeed": "this.RotationSpeed",
  "LightState": "this.LightState",
}*/

module.exports = function(data){
  var mainCode;
  if (data.preset == undefined) {
    mainCode = data.model.substr(0,2) + data.model.substr(8,8) + "pomowiswttli" + data.model.substr(-1);
  }else{
    mainCode = data.preset.main;
  }

  /*Basic Value */
  var codeConfig = data.defaultPresets;
  var valueCont = data.defaultPresets.VALUE;
  mainCode = mainCode.replace(/tt/g, parseInt(data.tempera).toString(16));
  mainCode = mainCode.replace(/po/g, data.power);
  mainCode = mainCode.replace(/mo/g, data.mode);
  mainCode = mainCode.replace(/wi/g, data.RotationSpeed);
  mainCode = mainCode.replace(/sw/g, data.SwingMode ? codeConfig.sw.on : codeConfig.sw.off);
  mainCode = mainCode.replace(/li/g, codeConfig.li.off);

  /*Extra Value */
  if (data.preset!==undefined && data.preset.EXTRA_VALUE) {
    valueCont = data.preset.EXTRA_VALUE;
    for (var index = 0; index < valueCont.length; index++) {
      switch (valueCont[index]) {
        case "t0t":
          var temp = (parseInt(data.preset.t0t) + parseInt(data.tempera) - 17) % 16;
          mainCode = mainCode.replace(/t0t/g, temp.toString(16).toUpperCase());
          break;
        case "t6t":
          var temp = (parseInt(data.preset.t6t) + parseInt(data.tempera) - 17) % 16;
          mainCode = mainCode.replace(/t6t/g, temp.toString(16).toUpperCase());
          break;
        case "t4wt":
          var temp = (parseInt(data.preset.t4wt) + parseInt(data.tempera) - 17) % 16;
          mainCode = mainCode.replace(/t4wt/g, temp.toString(16).toUpperCase());
          break;
        default:
          break;
      }
    }
  }
  return mainCode;
}