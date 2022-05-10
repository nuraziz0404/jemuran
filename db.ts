import knex from "knex";
import * as func from "./func";
let sess = [];
let tableName = "jemuran";

export let conn = knex({
  client: "mysql2",
  connection: {
    host: "db4free.net",
    port: 3306,
    user: "crazyzdb",
    password: "12qwaszx",
    database: "crazyzbot",
  },
});

let timeSort = (a, b) => {
  if (a.time > b.time) {
    return 1;
  } else if (b.time > a.time) {
    return -1;
  } else {
    return 0;
  }
};

export function upState(id: string, state: string, cuaca: string): Promise<Array<object>> {
  return new Promise((resolve) => {
    let data = {
      tool_id: id,
      state: state,
      cuaca: cuaca,
      time: func.time().join(" "),
    };
    conn(tableName)
      .insert(data)
      .then((e) => {
        data.time = data.time.split(" ").reverse().join(" ")
        resolve([data]);
        // console.log("done");
      })
      .catch((e) => {
        resolve([]);
        console.log(e);
      });
  });
}
function fTime(time:Date){
  let n = new Date(time).toLocaleString("en-GB", {hour12: false}).split(", ")
  return [n[0].split("/").reverse().join("-"), n[1]].reverse().join(" ")
}
export function getList(id: string): Promise<Array<any> | "err"> {
  return new Promise((resolve) => {
    conn(tableName)
      .where("tool_id", id)
      .then((e) => {
        if (e.length == 0) resolve([]);
        else
          resolve(
            e.sort(timeSort).map((x) => {
              return { ...x, time: fTime(x.time) };
            })
          );
      })
      .catch((e) => {
        console.log(e);
        resolve("err");
      });
  });
}
