"use strict";
Object.defineProperty(exports, "__esModule", {
    value: !0
}), Object.defineProperty(exports, "Digest", {
    enumerable: !0,
    get: ()=>s
});
const t = require("./result"), e = require("crypto");
class s {
    static stripQuotes(t) {
        return t.startsWith('"') && t.endsWith('"') ? t.substring(1, t.length - 1) : t;
    }
    static addQuotes(t) {
        return t.startsWith('"') && t.endsWith('"') ? t : '"' + t + '"';
    }
    static extractAuthenticateValues(e) {
        if ('digest' !== (e = e.trim()).slice(0, 6).toLowerCase()) return (0, t.Err)('Unable to determine header type. Are you sure this is a Digest header?');
        let s = e.slice(6), a = s.split(',').map((t)=>t.trim()).map((t)=>t.split('='));
        return (0, t.Ok)(a);
    }
    static parseAuthenticateHeader(e) {
        let s = [], a = this.extractAuthenticateValues(e);
        if (!a.ok) return a;
        s = a.value;
        let r = {
            realm: '',
            nonce: '',
            algorithm: 'md5',
            stale: !1,
            qop: 'auth'
        };
        for (let [i, o] of s)switch(i){
            case 'realm':
                r.realm = this.stripQuotes(o);
                break;
            case 'qop':
                r.qop = this.stripQuotes(o);
                break;
            case 'nonce':
                r.nonce = this.stripQuotes(o);
                break;
            case 'algorithm':
                r.algorithm = this.stripQuotes(o);
                break;
            case 'opaque':
                r.opaque = this.stripQuotes(o);
                break;
            case 'stale':
                r.stale = 'true' === this.stripQuotes(o).toLowerCase();
                break;
            case 'domain':
                r.domain = this.stripQuotes(o).split(' ');
                break;
            case 'charset':
                r.charset = this.stripQuotes(o);
                break;
            case 'userhash':
                r.userhash = 'true' === this.stripQuotes(o).toLowerCase();
        }
        return (0, t.Ok)(r);
    }
    static parseAuthorizationHeader(t) {}
    static buildAuthorizationHeader(t) {
        let e = [];
        for (let [s, a] of Object.entries(t))'boolean' == typeof a && (a = a.toString()), 'qop' === s || 'nc' === s || 'algorithm' === s || (a = this.addQuotes(a)), e.push(s + '=' + a);
        return 'Digest ' + e.join(', ');
    }
    static _computeHash(t, s) {
        let a = (0, e.createHash)(s);
        return a.update(t), a.digest('hex');
    }
    static computeHash(t) {
        let e = '', s = '', a = t.algorithm;
        if ('sess' === a.slice(a.length - 4, a.length)) {
            a = a.slice(0, a.length - 5);
            let r = this._computeHash([
                t.username,
                t.realm,
                t.password
            ].join(':'), a);
            e = this._computeHash([
                r,
                t.nonce,
                t.cnonce
            ].join(':'), a);
        } else e = this._computeHash([
            t.username,
            t.realm,
            t.password
        ].join(':'), a);
        s = this._computeHash([
            t.method,
            t.uri
        ].join(':'), a);
        let i = this._computeHash([
            e,
            t.nonce,
            t.nc,
            t.cnonce,
            t.qop,
            s
        ].join(':'), a);
        return i;
    }
}
