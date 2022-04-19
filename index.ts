import { Server } from "socket.io";
import express from "express";
import ejs from "ejs";
import http from "http";
import path from "path";
import * as db from "./db";
import * as func from "./func";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "html");
app.engine("html", ejs.renderFile);

const server = http.createServer(app);
let wss = new Server(server);

function page(filename: string) {
  return path.join(process.cwd(), "page", filename);
}
function parseCookie(cookie: string): Promise<object> {
  return new Promise((resolve) => {
    let parsed = {};
    for (let _ of cookie.split("; ")) {
      parsed[_.split("=")[0]] = _.split("=")[1] || "";
    }
    resolve(parsed);
  });
}

wss.on("connection", (client) => {
  client.on("message", async (e) => {
    let data: any = {};
    try {
      data = { data: typeof e == "string" ? JSON.parse(e) : typeof e == "object" ? e : String(e) };
    } catch (error) {
      // maybe it's the esp
      let args = String(e).split(" ");
      let id = args[0].includes("server") ? args[0] : "";
      let cmd = id ? args[1] : args[0];
      let msg = id && cmd ? args?.slice(2)?.join(" ") || "" : id || cmd ? args?.slice(1)?.join(" ") || "" : args?.join(" ") || "";
      data = id || cmd ? { data: { id, cmd, msg } } : id || { msg: String(e) };
    }
    let id = data.data?.id || "";
    if (!!data.data?.id && !!data.data?.msg) {
      let cmd = data.data.cmd || data.data.msg || data.msg;
      switch (cmd) {
        case "list":
          db.getList(data.data.id).then((e) => client.emit(data.data.id, JSON.stringify(e)));
          break;
        case "jemur":
          wss.emit(`server${id}`, "jemur");
          break;
        case "teduh":
          wss.emit(`server${id}`, "teduh");
          break;
        case "update":
          if (!id.includes("server")) return;
          id = id.replace("server", "");
          let args = data.data.msg.split(" ");
          let up = await db.upState(id, args[0] || "", args[1] || "");
          if (up && up.length > 0) wss.emit(id, JSON.stringify(up));
          break;
      }
    }
  });
});

app.get("/", async (req, res) => {
  let cookie = (await parseCookie(req.headers?.cookie || ""))["devid"]||"";
  if (!cookie) return res.sendFile(page("auth.html"));
  else {
    res.render(page("log.html"), { id: cookie });
  }
});
app.post("/", (req, res) => {
  let devid: string = req.body["devid"];
  if (devid) res.cookie("devid", devid, { maxAge: 1000 * 60 * 60 * 24 * 30 }).redirect("/");
});
app.get("/logout", (req, res) => {
  res.cookie("devid", "", { maxAge: 0 }).redirect("/");
});

let srv = server.listen(parseInt(process.env.PORT) || 8080, "0.0.0.0", () => {
  let port = String(srv.address()["port"]);
  console.log(`App listening on http://localhost${port == "80" ? "" : ":" + port}`);
});
