import * as http from 'http'; 
import { LookupFunction, Socket } from 'net';
import { Result } from './result';
import { Digest, WWWAuthenticateHeader } from './auth';
import { createHash, randomBytes } from 'crypto';

abstract class RequestBuilder {

	_signal?: AbortSignal;
	_protocol?: string;
	_host: string = 'localhost';
	_hostname?: string;
	_lookup?: LookupFunction;
	_createConnection?: ((options: http.ClientRequestArgs, oncreate: (err: Error, socket: Socket) => void) => Socket);
	_family?: number;
	_port: number = 80;;
 	_defaultPort?: number;
 	_localAddress?: string;
	_socketPath?: string;
	_maxHeaderSize: number = 16384;
	_method: string = 'GET';
 	_path: string = '/';
 	_headers: http.OutgoingHttpHeaders = {};
 	_auth?: string | null;
	_agent?: http.Agent | boolean;
	_timeout?: number;
	_setHost?: boolean;

	private defaultArgs(): http.ClientRequestArgs {
		return {
			host: 'localhost',
			maxHeaderSize: 16384,
			method: 'GET',
			path: '/',
			port: 80,
		}
	}

	public agent(agent: http.Agent | boolean): this {
		this._agent = agent;
		return this;
	}

	public auth(auth: string): this {
		this._auth = auth;
		return this;
	}

	public createConnection(fn: ((options: http.ClientRequestArgs, oncreate: (err: Error, socket: Socket) => void) => Socket)): this {
		this._createConnection = fn;
		return this;
	}

	public defaultPort(defaultPort: number): this {
		this._defaultPort = defaultPort;
		return this;
	}

	public family(family: number): this {
		this._family = family;
		return this;
	}

	public header(header: {[key: string]: string}): this {
		this._headers = this._headers === undefined ? header : Object.assign(this._headers, header);
		return this;
	}

	public host(host: string): this {
		this._host = host;
		return this;
	}

	public hostname(hostname: string): this {
		this._hostname = hostname;
		return this;
	}
	
	public localAddress(localAddress: string): this {
		this._localAddress = localAddress;
		return this;
	}

	public lookup(fn: LookupFunction): this {
		this._lookup = fn;
		return this;
	}

	public maxHeaderSize(maxHeaderSize: number): this {
		this._maxHeaderSize = maxHeaderSize;
		return this;
	}

	public method(method: string): this {
		this._method = method;
		return this;
	}

	public path(path: string): this {
		this._path = path;
		return this;
	}

	public port(port: number): this {
		this._port = port;
		return this;
	}

	public protocol(protocol: string): this {
		this._protocol = protocol;
		return this;
	}

	public setHost(setHost: boolean): this {
		this._setHost = setHost;
		return this;
	}

	public signal(signal: AbortSignal): this {
		this._signal = signal;
		return this;
	}

	public socketPath(socketPath: string): this {
		this._socketPath = socketPath;
		return this;
	}

	public timeout(timeout: number): this {
		this._timeout = timeout;
		return this;
	}
	
	protected compileOptions(): http.ClientRequestArgs {
		let options = this.defaultArgs();
		if (this._agent) options.agent = this._agent;
		if (this._auth) options.auth = this._auth;
		if (this._createConnection && !options.agent) options.createConnection = this._createConnection;
		if (this._defaultPort) options.defaultPort = this._defaultPort;
		if (this._family) options.family = this._family;
		if (this._headers) options.headers = this._headers;
		if (this._signal) options.signal = this._signal;
		if (this._timeout) options.timeout = this._timeout;
		if (!this._socketPath) {
			if (this._hostname) options.hostname = this._hostname;
			else options.host = this._host;
			options.port = this._port;
		} else {
			options.socketPath = this._socketPath;
		}
		if (this._lookup) options.lookup = this._lookup;
		options.maxHeaderSize = this._maxHeaderSize;
		options.method = this._method;
		options.path = this._path;
		options.protocol = this._protocol;
		options.setHost = this._setHost;
		return options;
	}
}

export class HttpResponse {
	private _body: Buffer;
	private _statusCode: number;
	private _statusMessage: string;
	private _headers: http.IncomingHttpHeaders;

	constructor(body: Buffer, statusCode: number, statusMessage: string, 
				headers: http.IncomingHttpHeaders) {
		this._body = body;
		this._statusCode = statusCode;
		this._statusMessage = statusMessage;
		this._headers = headers;
	}

	public json<T>(): Result<T> {
		try {
			const json_body: T = JSON.parse(this._body.toString());
			return {ok: true, value: json_body};
		} catch(e) {
			return {ok: false, error: new Error(`Error: Failed to parse json ${e}`)};
		}
	}

	public text(): string {
		return this._body.toString();
	}

	public bytes(): Buffer {
		return this._body;
	}

	public get statusCode(): number {
		return this._statusCode;
	}

	public get statusMessage(): string {
		return this._statusMessage;
	}

	public getHeader(header: string): Result<string|string[]> {
		if (Object.hasOwn(this._headers, header)) {
			return { ok: true, value: this._headers[header] ?? ''};
		} else {
			return { ok: false, error: new Error("Header " + header + " doesn't exist") };
		}
	}

	public getHeaders(): http.IncomingHttpHeaders {
		return this._headers;
	}
}

type QueryValues = [string, string];

export class BasicFetch extends RequestBuilder {
	private _body?: string | object = undefined;
	private _query: QueryValues[] = [];
	
	constructor(host?: string) {
		super();
		this._host = host ?? this._host;
	}

	public json(body: object): this {
		this._body = body;
		this._headers['content-type'] = 'application/json';
		return this;
	}

	public body(body: string): this {
		this._body = body;
		this._headers['content-type'] = 'text/plain';
		return this;
	}

	public query(query_params: QueryValues[]): this {
		this._query = this._query.concat(query_params);
		return this;
	}

	private handleQuery(path: string): string {
		if (this._query.length > 0) {
			// Join all parameters into a string and seperate them using ampersand
			let querys = this._query.map((p: QueryValues) => p[0] + '=' + p[1]).join('&');
			// Add the initial seperator and then append params
			path = path + '?' + querys;
		}
		return path
	}


	
	// Will always resolve. Will either return the value or an error.
	public send(): Promise<Result<HttpResponse>> {
		return new Promise(resolve => {
			// Compile options into list
			const options = this.compileOptions();
			// Handle any query parameters
			options.path = this.handleQuery(options.path ?? '');
			let request: http.ClientRequest = http.request(options, (res: http.IncomingMessage) => {
				let headers: http.IncomingHttpHeaders = res.headers ?? {};
				const temp = headers['content-length'];
				const content_length = typeof temp === 'string' ? parseInt(temp) : 1;
				const statusCode = typeof res.statusCode === 'number' ? res.statusCode : -1;
				const statusMessage = typeof res.statusMessage === 'string' ? res.statusMessage : '';
				let buf = Buffer.alloc(content_length, 0);
				let currentLength = 0;
				res.on('data', (chunk: Buffer) => {
					buf = buf.fill(chunk, currentLength);
					currentLength += chunk.length;
				});

				res.on('end', () => {
					resolve({ ok: true, value: new HttpResponse(buf, statusCode, statusMessage, headers)});
				});
			});	

			request.on('error', (e) => {
				resolve({ ok: false, error: new Error(`Request failed: ${e}`)});
			});
			if (this._body) {
				let body: string = '';
				if (typeof this._body === 'string') body = this._body;
				else body = JSON.stringify(this._body);
				request.end(body);
			} else {
				request.end();
			}
		});

	}

	public async send_digest(username: string, password: string): Promise<Result<HttpResponse>> {
		// Send first request to get digest header. Return result of request fails
		let send_result = await this.send();
		let response;
		if (send_result.ok) response = send_result.value;
		else return send_result;

		// Extract header or return result if failed.
		const header_result = response.getHeader('www-authenticate');
		let t_header: string | string[];
		if (header_result.ok) t_header = header_result.value;
		else return header_result

		// generate random bytes for cnonce
		const randomString = randomBytes(32).toString('hex');
		const cnonce = Buffer.from(randomString).toString('base64');

		// Parse header and add the response then resend. Return result of request fails.
		// or a bad header is found
		const AUTH_HEADER = t_header;
		if (typeof AUTH_HEADER === 'string') {
			let result = Digest.parseAuthenticateHeader(AUTH_HEADER);
			let parsed: WWWAuthenticateHeader;
			if (result.ok) parsed = result.value;
			else return result;
			const algorithm = parsed.algorithm ?? 'MD5';
			const digest_hash = Digest.computeHash({
				algorithm: algorithm,
				method: this._method,
				uri: this._path,
				realm: parsed.realm,
				username: username,
				password: password,
				nonce: parsed.nonce,
				nc: '00000001',
				cnonce: cnonce,
				qop: parsed.qop ?? 'auth',
			});

			const header = Digest.buildAuthorizationHeader({
				username: username,
				realm: parsed.realm,
				uri: this._path,
				cnonce: cnonce,
				nonce: parsed.nonce,
				nc: '00000001',
				response: digest_hash,
				qop: parsed.qop ?? 'auth',
				algorithm: algorithm,
			});
			this.header({'Authorization': header});
			let final = await this.send();
			return final;
		} else {
			return { ok: false, error: new Error('Got invalid header value') };
		}
	}
}
