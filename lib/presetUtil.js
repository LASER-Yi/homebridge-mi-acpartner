/*INPUT_DATA
  "model": "origin model data get from AC sync function",
  "power": "this.Active",
  "mode": "mode must pre-convert to command",
  "tempera": "temperature basic on mode"
  "SwingMode": "this.SwingMode",
  "RotationSpeed": "this.RotationSpeed",
  "LightState": "this.LightState",
}*/
const presets = require('../presets.json');

const defaultValue = presets.default;
const globalValue = presets.extra;
let tempera_offset = 0;

module.exports = function (model, pw, md, tp, sw, rot, li) {
  let code = model.substr(0, 2) + model.substr(8, 8);

  if (presets[code]) {
    code += presets[com_model].main;
  } else {
    code += "{po}{mo}{wi}{sw}{tt}{li}";
  }

  /*Basic value */
  code = code.replace(/\{po\}/g, pw);
  code = code.replace(/\{mo\}/g, md);
  code = code.replace(/\{wi\}/g, rot);
  code = code.replace(/\{sw\}/g, 1 - sw);
  code = code.replace(/\{tt\}/g, parseInt(tp).toString(16));
  var lstate = li;
  li == 1 ? lstate += '1' : lstate += '0';
  code = code.replace(/{li}/g, light.toLowerCase());

  /*Extra value */
  if (presets[com_model] && presets[com_model].extra_value) {
    let replaceArray = presets[com_model].extra_value;
    //Mode
    let origin_mode_str = defaultValue.mode[md];
    //If !power then !power
    let mode_str = origin_mode_str;
    if (pw == 0) mode_str = "off";
    //Speed
    let speed_str = defaultValue.wing[rot];
    //Temperature Offset
    tempera_offset = parseInt(tp) - 17;

    //Start extra replace
    let replace_code = null;
    for (var index in replaceArray) {
      switch (replaceArray[index]) {
        //min temperature + tempera_offset
        case "t0t":
          replace_code = preset_mode_util("\{t0t\}", mode_str, origin_mode_str);
          code = code.replace(/\{t0t\}/g, replace_code);
          break;
        case "t6t":
          replace_code = preset_mode_util("\{t6t\}", mode_str, origin_mode_str);
          code = code.replace(/\{t6t\}/g, replace_code);
          break;

        //string replace
        case "pmp":
          replace_code = globalValue.pmp[mode_str];
          code = code.replace(/\{pmp\}/g, replace_code);
          break;
        case "wbw":
          replace_code = globalValue.wbw[speed_str];
          code = code.replace(/\{wbw\}/g, replace_code);
          break;

        //replace basic by speed value
        case "wtw":
          replace_code = parseInt(globalValue.wtw, 16);
          switch (speed_str) {
            case "high":
            case "middle":
              replace_code += 2;
            case "low":
              replace_code += 1;
            case "auto":
              break;
          }
          replace_code = replace_code.toString(16).substr(-1).toUpperCase();
          code = code.replace(/\{wtw\}/g, replace_code);
          break;
        case "w4tw":
          replace_code = parseInt(globalValue.w4tw[origin_mode_str], 16);
          switch (speed_str) {
            case "high":
            case "middle":
              replace_code += 2;
            case "low":
              replace_code += 1;
            case "auto":
            default:
              break;
          }
          replace_code = replace_code.toString(16).substr(-1).toUpperCase();
          code = code.replace(/\{w4tw\}/g, replace_code);
          break;
      }
    }
  }
  return code;
}

// This function replace select-name then add a tempera_offset after.
function preset_mode_util(replace_name, mode_str, origin_mode_str) {
  let _code = null;
  if (globalValue[replace_name][mode_str + "_fix"] !== undefined) {
    //Replace mode_fix code
    _code = globalValue[replace_name][mode_str + "_fix"].toUpperCase();
  } else {
    if (!globalValue[replace_name][mode_str]) {
      if (globalValue[replace_name][origin_mode_str]) {
        //Replace origin mode code
        _code = parseInt(globalValue[replace_name][origin_mode_str], 16);
      } else {
        //Replace origin mode_fix code
        _code = parseInt(globalValue[replace_name][origin_mode_str + "_fix"], 16);
      }
    } else {
      //Replace mode code
      _code = parseInt(globalValue[replace_name][mode_str], 16);
    }
    _code = _code + tempera_offset;
    _code = _code.toString(16).substr(-1).toUpperCase();
  }
  return _code;
}