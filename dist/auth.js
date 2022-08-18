"use strict";
Object.defineProperty(exports, "__esModule", {
    value: !0
}), Object.defineProperty(exports, "Digest", {
    enumerable: !0,
    get: ()=>e
});
const t = require("crypto");
class e {
    static stripQuotes(t) {
        return t.startsWith('"') && t.endsWith('"') ? t.substring(1, t.length - 1) : t;
    }
    static addQuotes(t) {
        return t.startsWith('"') && t.endsWith('"') ? t : '"' + t + '"';
    }
    static extractAuthenticateValues(t) {
        if ('digest' !== (t = t.trim()).slice(0, 6).toLowerCase()) return {
            ok: !1,
            error: Error('Unable to determine header type. Are you sure this is a Digest header?')
        };
        let e = t.slice(6), s = e.split(',').map((t)=>t.trim()).map((t)=>t.split('='));
        return {
            ok: !0,
            value: s
        };
    }
    static parseAuthenticateHeader(t) {
        let e = [], s = this.extractAuthenticateValues(t);
        if (!s.ok) return s;
        e = s.value;
        let a = {
            realm: '',
            nonce: '',
            algorithm: 'md5',
            stale: !1,
            qop: 'auth'
        };
        for (let [r, i] of e)switch(r){
            case 'realm':
                a.realm = this.stripQuotes(i);
                break;
            case 'qop':
                a.qop = this.stripQuotes(i);
                break;
            case 'nonce':
                a.nonce = this.stripQuotes(i);
                break;
            case 'algorithm':
                a.algorithm = this.stripQuotes(i);
                break;
            case 'opaque':
                a.opaque = this.stripQuotes(i);
                break;
            case 'stale':
                a.stale = 'true' === this.stripQuotes(i).toLowerCase();
                break;
            case 'domain':
                a.domain = this.stripQuotes(i).split(' ');
                break;
            case 'charset':
                a.charset = this.stripQuotes(i);
                break;
            case 'userhash':
                a.userhash = 'true' === this.stripQuotes(i).toLowerCase();
        }
        return {
            ok: !0,
            value: a
        };
    }
    static parseAuthorizationHeader(t) {}
    static buildAuthorizationHeader(t) {
        let e = [];
        for (let [s, a] of Object.entries(t))'boolean' == typeof a && (a = a.toString()), 'qop' === s || 'nc' === s || 'algorithm' === s || (a = this.addQuotes(a)), e.push(s + '=' + a);
        return 'Digest ' + e.join(', ');
    }
    static _computeHash(e, s) {
        let a = (0, t.createHash)(s);
        return a.update(e), a.digest('hex');
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
