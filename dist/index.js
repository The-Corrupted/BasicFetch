"use strict";
Object.defineProperty(exports, "__esModule", {
    value: !0
}), !function(e, t) {
    for(var r in t)Object.defineProperty(e, r, {
        enumerable: !0,
        get: t[r]
    });
}(exports, {
    BasicFetch: ()=>e.BasicFetch,
    HttpResponse: ()=>e.HttpResponse,
    Result: ()=>t.Result,
    Ok: ()=>t.Ok,
    Err: ()=>t.Err,
    WWWAuthenticateHeader: ()=>r.WWWAuthenticateHeader,
    WWWAuthorizationHeader: ()=>r.WWWAuthorizationHeader,
    WWWAuthorizationHashInfo: ()=>r.WWWAuthorizationHashInfo,
    Digest: ()=>r.Digest
});
const e = require("./fetch"), t = require("./result"), r = require("./auth");
