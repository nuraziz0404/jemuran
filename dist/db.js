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
exports.getList = exports.upState = exports.conn = void 0;
const knex_1 = __importDefault(require("knex"));
const func = __importStar(require("./func"));
let sess = [];
let tableName = "jemuran";
exports.conn = (0, knex_1.default)({
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
    }
    else if (b.time > a.time) {
        return -1;
    }
    else {
        return 0;
    }
};
function upState(id, state, cuaca) {
    return new Promise((resolve) => {
        let data = {
            tool_id: id,
            state: state,
            cuaca: cuaca,
            time: func.time().join(" "),
        };
        (0, exports.conn)(tableName)
            .insert(data)
            .then((e) => {
            resolve([data]);
        })
            .catch((e) => {
            resolve([]);
            console.log(e);
        });
    });
}
exports.upState = upState;
function fTime(time) {
    let n = new Date(time).toLocaleString("en-GB", { hour12: false }).split(", ");
    return [n[0].split("/").reverse().join("-"), n[1]].reverse().join(" ");
}
function getList(id) {
    return new Promise((resolve) => {
        (0, exports.conn)(tableName)
            .where("tool_id", id)
            .then((e) => {
            if (e.length == 0)
                resolve([]);
            else
                resolve(e.sort(timeSort).map((x) => {
                    return { ...x, time: fTime(x.time) };
                }));
        })
            .catch((e) => {
            console.log(e);
            resolve("err");
        });
    });
}
exports.getList = getList;
//# sourceMappingURL=db.js.map