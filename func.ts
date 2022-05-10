export function randString(length: number, uppercase: boolean = true) {
  let str = "qwertyuiopasdfghjklzxcvbnm".split("");
  let res = "";
  for (let i = 0; i < length; i++) res += str[Math.round(Math.random() * (str.length - 1))] || "";
  return uppercase ? res.toUpperCase() : res.toLowerCase();
}

export function oneMonth() {
  return new Date(new Date().setDate(new Date().getDate() + 30)).toLocaleDateString("en-GB").split("/").reverse().join("-");
}

export function fTime(time:Date){
  let n = new Date(time).toLocaleString("en-GB", {timeZone: "Asia/Jakarta", hour12: false}).split(", ")
  return [n[0].split("/").reverse().join("-"), n[1]].reverse().join(" ")
}

export function time(){
  let n = new Date().toLocaleString("en-GB", {timeZone: "Asia/Jakarta", hour12: false}).split(", ")
  return [n[0].split("/").reverse().join("-"), n[1]]
}
