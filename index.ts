import { Server } from "socket.io";
import express from "express";
import ejs from "ejs";
import http from "http";
import path from "path";
import * as db from "./db";
import * as func from "./func";
import httpProxy from "http-proxy"
let proxy = httpProxy.createProxyServer();

let args = process.argv.join(" ").split(" ").filter(e=>e.startsWith("--")).reduce((a, b)=>{return {...a, [b.split("=")[0].slice(2)]:b.split("=")[1]||true}}, {});

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
  if(args["debug"]) console.log("[client] connected")
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
app.get("/about", (req, res, next) => {
  res.redirect("http://10.30.30.129/");
});

let srv = server.listen(parseInt(process.env.PORT || args['port']) || 8080, "0.0.0.0", () => {
  let port = String(srv.address()["port"]);
  console.log(`App listening on ${port == "443" ? "https://localhost" :  port == "80" ? "http://localhost" : ("http://localhost:"+port)}`);
});
