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
  let code;
  /**com_mode -> send command front  */
  let com_model = model.substr(0, 2) + model.substr(8, 8);
  //code = com_model + "_po_mo_wi_sw_tt_li" + model.substr(-1);
  code = com_model + "_po_mo_wi_sw_tt_li";

  if (presets[com_model]) {
    code += presets[com_model].main;
  }

  /*Basic value */
  code = code.replace(/_tt/g, parseInt(tp).toString(16));
  code = code.replace(/_po/g, pw);
  code = code.replace(/_mo/g, md);
  code = code.replace(/_wi/g, rot);
  code = code.replace(/_sw/g, 1 - sw);
  var light = li;
  li === '1' ? light += '1' : light += '0';
  code = code.replace(/_li/g, light.toLowerCase());

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
    tempera_offset = tp - 17;

    //Start extra replace
    let replace_code = null;
    for (var index in replaceArray) {
      switch (replaceArray[index]) {
        //min temperature + tempera_offset
        case "_t0t":
          replace_code = preset_mode_util("_t0t", mode_str, origin_mode_str);
          code = code.replace(/_t0t/g, replace_code);
          break;
        case "_t6t":
          replace_code = preset_mode_util("_t6t", mode_str, origin_mode_str);
          code = code.replace(/_t6t/g, replace_code);
          break;

        //string replace
        case "_pmp":
          replace_code = globalValue._pmp[mode_str];
          code = code.replace(/_pmp/g, replace_code);
          break;
        case "_wbw":
          replace_code = globalValue._wbw[speed_str];
          code = code.replace(/_wbw/g, replace_code);
          break;

        //replace basic by speed value
        case "_wtw":
          replace_code = parseInt(globalValue._wtw, 16);
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
          code = code.replace(/_wtw/g, replace_code);
          break;
        case "_w4tw":
          replace_code = parseInt(globalValue._w4tw[origin_mode_str], 16);
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
          code = code.replace(/_w4tw/g, replace_code);
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