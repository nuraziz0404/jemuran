"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.time = exports.fTime = exports.oneMonth = exports.randString = void 0;
function randString(length, uppercase = true) {
    let str = "qwertyuiopasdfghjklzxcvbnm".split("");
    let res = "";
    for (let i = 0; i < length; i++)
        res += str[Math.round(Math.random() * (str.length - 1))] || "";
    return uppercase ? res.toUpperCase() : res.toLowerCase();
}
exports.randString = randString;
function oneMonth() {
    return new Date(new Date().setDate(new Date().getDate() + 30)).toLocaleDateString("en-GB").split("/").reverse().join("-");
}
exports.oneMonth = oneMonth;
function fTime(time) {
    let n = new Date(time).toLocaleString("en-GB", { timeZone: "Asia/Jakarta", hour12: false }).split(", ");
    return [n[0].split("/").reverse().join("-"), n[1]].reverse().join(" ");
}
exports.fTime = fTime;
function time() {
    let n = new Date().toLocaleString("en-GB", { timeZone: "Asia/Jakarta", hour12: false }).split(", ");
    return [n[0].split("/").reverse().join("-"), n[1]];
}
exports.time = time;
//# sourceMappingURL=func.js.map