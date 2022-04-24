"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const express_1 = __importDefault(require("express"));
const ejs_1 = __importDefault(require("ejs"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const db = __importStar(require("./db"));
let args = process.argv.join(" ").split(" ").filter(e => e.startsWith("--")).reduce((a, b) => { return { ...a, [b.split(":")[0].slice(2)]: b.split(":")[1] || true }; }, {});
const app = (0, express_1.default)();
app.use(express_1.default.urlencoded({ extended: true }));
app.set("view engine", "html");
app.engine("html", ejs_1.default.renderFile);
const server = http_1.default.createServer(app);
let wss = new socket_io_1.Server(server);
function page(filename) {
    return path_1.default.join(process.cwd(), "page", filename);
}
function parseCookie(cookie) {
    return new Promise((resolve) => {
        let parsed = {};
        for (let _ of cookie.split("; ")) {
            parsed[_.split("=")[0]] = _.split("=")[1] || "";
        }
        resolve(parsed);
    });
}
wss.on("connection", (client) => {
    if (args["debug"])
        console.log("[client] connecting");
    client.on("message", async (e) => {
        let data = {};
        try {
            data = { data: typeof e == "string" ? JSON.parse(e) : typeof e == "object" ? e : String(e) };
        }
        catch (error) {
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
                    if (!id.includes("server"))
                        return;
                    id = id.replace("server", "");
                    let args = data.data.msg.split(" ");
                    let up = await db.upState(id, args[0] || "", args[1] || "");
                    if (up && up.length > 0)
                        wss.emit(id, JSON.stringify(up));
                    break;
            }
        }
    });
});
app.get("/", async (req, res) => {
    let cookie = (await parseCookie(req.headers?.cookie || ""))["devid"] || "";
    if (!cookie)
        return res.sendFile(page("auth.html"));
    else {
        res.render(page("log.html"), { id: cookie });
    }
});
app.post("/", (req, res) => {
    let devid = req.body["devid"];
    if (devid)
        res.cookie("devid", devid, { maxAge: 1000 * 60 * 60 * 24 * 30 }).redirect("/");
});
app.get("/logout", (req, res) => {
    res.cookie("devid", "", { maxAge: 0 }).redirect("/");
});
let srv = server.listen(parseInt(process.env.PORT) || 8080, "0.0.0.0", () => {
    let port = String(srv.address()["port"]);
    console.log(`App listening on http://localhost${port == "80" ? "" : ":" + port}`);
});
//# sourceMappingURL=index.js.map