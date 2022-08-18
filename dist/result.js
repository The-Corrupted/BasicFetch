"use strict";
Object.defineProperty(exports, "__esModule", {
    value: !0
}), !function(e, r) {
    for(var o in r)Object.defineProperty(e, o, {
        enumerable: !0,
        get: r[o]
    });
}(exports, {
    Ok: ()=>e,
    Err: ()=>r
});
const e = (e)=>({
        ok: !0,
        value: e
    }), r = (e)=>({
        ok: !1,
        error: Error(e)
    });
