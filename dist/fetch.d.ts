/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import * as http from 'http';
import { LookupFunction, Socket } from 'net';
import { Result } from './result';
declare abstract class RequestBuilder {
    _signal?: AbortSignal;
    _protocol?: string;
    _host: string;
    _hostname?: string;
    _lookup?: LookupFunction;
    _createConnection?: ((options: http.ClientRequestArgs, oncreate: (err: Error, socket: Socket) => void) => Socket);
    _family?: number;
    _port: number;
    _defaultPort?: number;
    _localAddress?: string;
    _socketPath?: string;
    _maxHeaderSize: number;
    _method: string;
    _path: string;
    _headers: http.OutgoingHttpHeaders;
    _auth?: string | null;
    _agent?: http.Agent | boolean;
    _timeout?: number;
    _setHost?: boolean;
    private defaultArgs;
    agent(agent: http.Agent | boolean): this;
    auth(auth: string): this;
    createConnection(fn: ((options: http.ClientRequestArgs, oncreate: (err: Error, socket: Socket) => void) => Socket)): this;
    defaultPort(defaultPort: number): this;
    family(family: number): this;
    header(header: {
        [key: string]: string;
    }): this;
    host(host: string): this;
    hostname(hostname: string): this;
    localAddress(localAddress: string): this;
    lookup(fn: LookupFunction): this;
    maxHeaderSize(maxHeaderSize: number): this;
    method(method: string): this;
    path(path: string): this;
    port(port: number): this;
    protocol(protocol: string): this;
    setHost(setHost: boolean): this;
    signal(signal: AbortSignal): this;
    socketPath(socketPath: string): this;
    timeout(timeout: number): this;
    protected compileOptions(): http.ClientRequestArgs;
}
export declare class HttpResponse {
    private _body;
    private _statusCode;
    private _statusMessage;
    private _headers;
    constructor(body: Buffer, statusCode: number, statusMessage: string, headers: http.IncomingHttpHeaders);
    json<T>(): Result<T>;
    text(): string;
    bytes(): Buffer;
    get statusCode(): number;
    get statusMessage(): string;
    getHeader(header: string): Result<string | string[]>;
    getHeaders(): http.IncomingHttpHeaders;
}
declare type QueryValues = [string, string];
export declare class BasicFetch extends RequestBuilder {
    private _body?;
    private _query;
    constructor(host?: string);
    json(body: object): this;
    body(body: string): this;
    query(query_params: QueryValues[]): this;
    private handleQuery;
    send(): Promise<Result<HttpResponse>>;
    send_digest(username: string, password: string): Promise<Result<HttpResponse>>;
}
export {};
