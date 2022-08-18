"use strict";
Object.defineProperty(exports, "__esModule", {
    value: !0
}), !function(t, e) {
    for(var s in e)Object.defineProperty(t, s, {
        enumerable: !0,
        get: e[s]
    });
}(exports, {
    HttpResponse: ()=>o,
    BasicFetch: ()=>a
});
const t = require("@swc/helpers/lib/_interop_require_wildcard.js").default, e = t(require("http")), s = require("./result"), r = require("./auth"), h = require("crypto");
class i {
    _host = 'localhost';
    _port = 80;
    _maxHeaderSize = 16384;
    _method = 'GET';
    _path = '/';
    _headers = {};
    defaultArgs() {
        return {
            host: 'localhost',
            maxHeaderSize: 16384,
            method: 'GET',
            path: '/',
            port: 80
        };
    }
    agent(t) {
        return this._agent = t, this;
    }
    auth(t) {
        return this._auth = t, this;
    }
    createConnection(t) {
        return this._createConnection = t, this;
    }
    defaultPort(t) {
        return this._defaultPort = t, this;
    }
    family(t) {
        return this._family = t, this;
    }
    header(t) {
        return this._headers = void 0 === this._headers ? t : Object.assign(this._headers, t), this;
    }
    host(t) {
        return this._host = t, this;
    }
    hostname(t) {
        return this._hostname = t, this;
    }
    localAddress(t) {
        return this._localAddress = t, this;
    }
    lookup(t) {
        return this._lookup = t, this;
    }
    maxHeaderSize(t) {
        return this._maxHeaderSize = t, this;
    }
    method(t) {
        return this._method = t, this;
    }
    path(t) {
        return this._path = t, this;
    }
    port(t) {
        return this._port = t, this;
    }
    protocol(t) {
        return this._protocol = t, this;
    }
    setHost(t) {
        return this._setHost = t, this;
    }
    signal(t) {
        return this._signal = t, this;
    }
    socketPath(t) {
        return this._socketPath = t, this;
    }
    timeout(t) {
        return this._timeout = t, this;
    }
    compileOptions() {
        let t = this.defaultArgs();
        return this._agent && (t.agent = this._agent), this._auth && (t.auth = this._auth), this._createConnection && !t.agent && (t.createConnection = this._createConnection), this._defaultPort && (t.defaultPort = this._defaultPort), this._family && (t.family = this._family), this._headers && (t.headers = this._headers), this._signal && (t.signal = this._signal), this._timeout && (t.timeout = this._timeout), this._socketPath ? t.socketPath = this._socketPath : (this._hostname ? t.hostname = this._hostname : t.host = this._host, t.port = this._port), this._lookup && (t.lookup = this._lookup), t.maxHeaderSize = this._maxHeaderSize, t.method = this._method, t.path = this._path, t.protocol = this._protocol, t.setHost = this._setHost, t;
    }
}
class o {
    constructor(t, e, s, r){
        this._body = t, this._statusCode = e, this._statusMessage = s, this._headers = r;
    }
    json() {
        try {
            let t = JSON.parse(this._body.toString());
            return (0, s.Ok)(t);
        } catch (e) {
            return (0, s.Err)(`Error: Failed to parse json ${e}`);
        }
    }
    text() {
        return this._body.toString();
    }
    bytes() {
        return this._body;
    }
    get statusCode() {
        return this._statusCode;
    }
    get statusMessage() {
        return this._statusMessage;
    }
    getHeader(t) {
        return Object.hasOwn(this._headers, t) ? (0, s.Ok)(this._headers[t] ?? '') : (0, s.Err)("Header " + t + " doesn't exist");
    }
    getHeaders() {
        return this._headers;
    }
}
class a extends i {
    _body = void 0;
    _query = [];
    constructor(t){
        super(), this._host = t ?? this._host;
    }
    json(t) {
        return this._body = t, this._headers['content-type'] = 'application/json', this;
    }
    body(t) {
        return this._body = t, this._headers['content-type'] = 'text/plain', this;
    }
    query(t) {
        return this._query = this._query.concat(t), this;
    }
    handleQuery(t) {
        return this._query.length > 0 && (t = t + '?' + this._query.map((t)=>t[0] + '=' + t[1]).join('&')), t;
    }
    send() {
        return new Promise((t)=>{
            let r = this.compileOptions();
            r.path = this.handleQuery(r.path ?? '');
            let h = e.request(r, (e)=>{
                let r = e.headers ?? {}, h = r['content-length'], i = 'string' == typeof h ? parseInt(h) : 1, a = 'number' == typeof e.statusCode ? e.statusCode : -1, n = 'string' == typeof e.statusMessage ? e.statusMessage : '', u = Buffer.alloc(i, 0), d = 0;
                e.on('data', (t)=>{
                    u = u.fill(t, d), d += t.length;
                }), e.on('end', ()=>{
                    t((0, s.Ok)(new o(u, a, n, r)));
                });
            });
            if (h.on('error', (e)=>{
                t((0, s.Err)(`Request failed: ${e}`));
            }), this._body) {
                let i = '';
                i = 'string' == typeof this._body ? this._body : JSON.stringify(this._body), h.end(i);
            } else h.end();
        });
    }
    async send_digest(t, e) {
        let i = await this.send(), o;
        if (!i.ok) return i;
        o = i.value;
        let a = o.getHeader('www-authenticate'), n;
        if (!a.ok) return a;
        n = a.value;
        let u = (0, h.randomBytes)(32).toString('hex'), d = Buffer.from(u).toString('base64'), l = n;
        if ('string' != typeof l) return (0, s.Err)('Got invalid header value');
        {
            let c = r.Digest.parseAuthenticateHeader(l), p;
            if (!c.ok) return c;
            p = c.value;
            let m = p.algorithm ?? 'MD5', g = r.Digest.computeHash({
                algorithm: m,
                method: this._method,
                uri: this._path,
                realm: p.realm,
                username: t,
                password: e,
                nonce: p.nonce,
                nc: '00000001',
                cnonce: d,
                qop: p.qop ?? 'auth'
            }), y = r.Digest.buildAuthorizationHeader({
                username: t,
                realm: p.realm,
                uri: this._path,
                cnonce: d,
                nonce: p.nonce,
                nc: '00000001',
                response: g,
                qop: p.qop ?? 'auth',
                algorithm: m
            });
            return this.header({
                Authorization: y
            }), await this.send();
        }
    }
}
