



module.exports = function (model, originIR) {
    if (originIR.substr(0, 2) !== "FE") {
        // Not IR code
        return null;
    }
    
    var slot = Byte2Hex([121]);
    var ircode = originIR.slice(0, 2) + model.slice(4, 16) + "94701FFF" + slot + "FF" + originIR.slice(26, 32) + "27";
    var pre_sum = Hex2Byte(ircode);

    var sum = 0;
    pre_sum.forEach((value) => {
        sum += value;
    })

    var checksum = [sum & 0xFF];

    ircode = ircode + Byte2Hex(checksum) + code.slice(36);

    return ircode;
}

function Hex2Byte(str) {
    let pos = 0;
    let len = str.length;
    if (len % 2 != 0) {
        return null;
    }
    len /= 2;
    let hex = new Array();
    for (let i = 0; i < len; i++) {
        let s = str.substr(pos, 2);
        let v = parseInt(s, 16);
        hex.push(v);
        pos += 2;
    }
    return hex;
}

function Byte2Hex(bytes) {
    let hexs = "";
    for (let i = 0; i < bytes.length; i++) {
        let hex = (bytes[i]).toString(16);

        if (hex.length == 1) {
            hexs += '0' + hex.toUpperCase();
        }
        hexs += hex.toUpperCase();
    }
    return hexs;
}