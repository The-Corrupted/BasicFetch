import { Result } from './result';
export interface WWWAuthenticateHeader {
    realm: string;
    domain?: string[];
    nonce: string;
    opaque?: string;
    stale?: boolean;
    algorithm?: string;
    qop: string;
    charset?: string;
    userhash?: boolean;
}
export interface WWWAuthorizationHeader {
    response: string;
    username: string;
    realm: string;
    uri: string;
    qop: string;
    cnonce: string;
    nc: string;
    userhash?: boolean;
    nonce: string;
    algorithm: string;
}
export interface WWWAuthorizationHashInfo {
    username: string;
    password: string;
    nonce: string;
    nc: string;
    cnonce: string;
    qop: string;
    realm: string;
    uri: string;
    algorithm: string;
    method: string;
}
export declare class Digest {
    private static stripQuotes;
    private static addQuotes;
    private static extractAuthenticateValues;
    static parseAuthenticateHeader(header: string): Result<WWWAuthenticateHeader>;
    static parseAuthorizationHeader(header: string): WWWAuthorizationHeader;
    static buildAuthorizationHeader(header: WWWAuthorizationHeader): string;
    private static _computeHash;
    static computeHash(hashObject: WWWAuthorizationHashInfo): string;
}
