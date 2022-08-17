/*
 * RFC-7616: Digest is a challenge response paradigm. The challenge consists of
 * a nonce value sent from the server as well as a hashing algorithm ( typically MD5 )
 * A valid response consists of an unkeyed digest of the username, password
 * nonce, method, and requested URI. 
 *
*/


import { Result } from './result';
import { createHash } from 'crypto';

export interface WWWAuthenticateHeader {
	// A string displayed to the user so they know what username/password
	// to use. May also indicate users that have access.
	realm: string,
	// A space seperated list of URI's that defines the protection space.
	// If this is missing or empty it should be assumed the protection space consists
	// of all URI's on the web-origin.
	domain?: string[],
	// Server specified string which is used as part of the challenge
	// and will usually be Base64 or hexademical data.
	nonce: string,
	// A string of data from the server that needs to be returned by the client
	// unchanged in the Authorization header field. This string will also likely
	// be Base64 or hex data
	opaque?: string,
	// A case insensitive flag indicating the previous request from the client
	// was rejected because the nonce had gone stale. If this value is true
	// then the client may need to retry the request.
	stale?: boolean,
	// A string indicating the algorithm to use. If empty it should be assumed
	// to be MD5. When used with digest, each algorithm has a variant. The session
	// and non-session variant. The session version is denoted with <algorithm>-sess.
	algorithm?: string,
	// This value must be present. It is a string of one or more tokens that indicates
	// the quality of protection. auth indicates authentication and auth-int indicates
	// authentication with integrity protection.
	qop: string,
	// Optional parameter used by the server to indicate encoding. Only allows
	// UTF-8
	charset?: string,
	// Optional parameter used by the server to indicate that it supports username hashing
	// Valid values are true or false and it defauls to false.
	userhash?: boolean,
}

export interface WWWAuthorizationHeader {
	// A string of hex digits computed using information from the user
	// and server.
	response: string,
	// The users name in the specified realm. The string can either be clear text or
	// hexadecimal if the server supports it ( as indicated by userhash ).
	username: string,
	// The realm value. See above
	realm: string,
	// The effective request URI. It's duplicated because proxies can change the request
	// target
	uri: string,
	// Indicates quality of protection used for the message. It must be one of the
	// alternatives offered by the server
	qop: string,
	// This value must be used. The cnonce is an opaque quoted ASCII-only string value
	// provided by the client and used by both the client and server to avoid plaintext
	// attacks.
	cnonce: string,
	// This value must be used. The nc parameter stands for nonce count. It is a 
	// hexadecimal count of the number of requests ( including the current request )
	// that the client has sent with the nonce value. In the first request sent with a
	// given nonce value the client would send "nc=00000001". The purpose of this is
	// to detect replay attacks.
	nc: string,
	// Optional parameter used by the client to indicate that the username has been
	// hashed. Defaults to false
	userhash?: boolean,
	algorithm: string,
}

export interface WWWAuthorizationHashInfo {
	username: string,
	password: string,
	nonce: string,
	nc: string,
	cnonce: string,
	qop: string,
	realm: string,
	uri: string,
	algorithm: string,
	method: string,
}

export class Digest {

	private static stripQuotes(quotedString: string): string {
		if (quotedString.startsWith('"') && quotedString.endsWith('"')) 
			return quotedString.substring(1, quotedString.length -1);
		else return quotedString;
	}

	private static addQuotes(str: string): string {
		if (str.startsWith('"') && str.endsWith('"')) {
			return str;
		} else {
			return '"' + str + '"';
		}
	}

	private static extractAuthenticateValues(headerString: string): Result<string[][]> {
		headerString = headerString.trim();
		if (headerString.slice(0,6).toLowerCase() !== 'digest') 
			return {ok: false, error: new Error('Unable to determine header type. Are you sure this is a Digest header?')};

		const slice = headerString.slice(6,);
		const values = slice.split(',').map(v=>v.trim()).map(v=>v.split('='));
		return {ok: true, value: values};
	}

	public static parseAuthenticateHeader(header: string): Result<WWWAuthenticateHeader> {
		// Get an array of [key, value] pairs
		let values: string[][] = [];
		const result = this.extractAuthenticateValues(header);
		if (result.ok) values = result.value;
		else return result;
		const baseHeader: WWWAuthenticateHeader = { realm: '', nonce: '', algorithm: 'md5', stale: false, qop: 'auth'};
		for (let [key, val] of values) {
			switch (key) {
				case 'realm': {
					baseHeader.realm = this.stripQuotes(val);
					break;
				}
				case 'qop': {
					baseHeader.qop = this.stripQuotes(val);
					break;
				}
				case 'nonce': {
					baseHeader.nonce = this.stripQuotes(val);
					break;
				}
				case 'algorithm': {
					baseHeader.algorithm = this.stripQuotes(val);
					break;
				}
				case 'opaque': {
					baseHeader.opaque = this.stripQuotes(val);
					break;
				}
				case 'stale': {
					baseHeader.stale = this.stripQuotes(val).toLowerCase() === 'true';
					break;
				}
				case 'domain': {
					baseHeader.domain = this.stripQuotes(val).split(' ');
					break;
				}
				case 'charset': {
					baseHeader.charset = this.stripQuotes(val);
					break;
				}
				case 'userhash': {
					baseHeader.userhash = this.stripQuotes(val).toLowerCase() === 'true';
					break;
				}
			}

		}
		return {ok: true, value: baseHeader};
	}
	// TODO
	//@ts-ignore
	public static parseAuthorizationHeader(header: string): WWWAuthorizationHeader {

	}
	// TODO
	//@ts-ignore
	public static buildAuthorizationHeader(header: WWWAuthorizationHeader): string {
		let header_entries = []
		let header_str = 'Digest ';
		for (let [key, value] of Object.entries(header)) {
			if (typeof value === 'boolean') value = value.toString();
			// qop nc and algorithm must not be quoted. Everything else needs to be
			// requoted when sent back.
			if (!(key === 'qop' || key === 'nc' || key === 'algorithm')) value = this.addQuotes(value);
			header_entries.push(key + '=' + value);
		}
		return header_str + header_entries.join(', ');
	}

	// TODO
	// @ts-ignore
	private static _computeHash(str: string, algorithm: string): string {
		const hasher = createHash(algorithm);
		hasher.update(str);
		return hasher.digest('hex');
		
	}
		
	/*
	 * If qop is auth or auth-int then:
	 * response = KD (H1(A1), unq(nonce)
	 * ":" nc
	 * ":" unq(cnonce)
	 * ":" unq(qop)
	 * ":" H(A2)
	 * where A1 is unq(username) ":" unq(realm) ":" passwd
	 * if alorithm is sess then the hash should include the cnonce:
	 * H( unq(username) ":" unq(realm) ":" passwd )
	 *     ":" unq(nonce-prime) ":" unq(cnonce-prime)
	 *
	 * where A2 is Method ":" request-uri if auth or
	 * Method ":" request-uri ":" H(entity-body) if auth-int
	 *
	 * If userhash is true then the client must calculate a user hash and provide it after
	 * true
	 * The userhash is calculated as such
	 * username = H( unq(username) ":" unq(realm) )
	*/
	public static computeHash(hashObject: WWWAuthorizationHashInfo): string {
		let a1: string = '';
		let a2: string = '';
		let algorithm: string = hashObject.algorithm;
		if (algorithm.slice(algorithm.length-4, algorithm.length) === 'sess') {
			algorithm = algorithm.slice(0,algorithm.length-5);
			let h1 = this._computeHash([hashObject.username, hashObject.realm, hashObject.password].join(':'), algorithm);
			a1 = this._computeHash([h1, hashObject.nonce, hashObject.cnonce].join(':'), algorithm);
		} else {
			a1 = this._computeHash([hashObject.username, hashObject.realm, hashObject.password].join(':'), algorithm);
		}

		// Don't handle a2 auth-int for now since I'm not really sure what 'entity-body' is nor am I sure where I would extract
		// that from. Just use the base method : uri hash
		a2 = this._computeHash([hashObject.method, hashObject.uri].join(':'), algorithm);
		const response = this._computeHash([a1, hashObject.nonce, hashObject.nc, hashObject.cnonce, hashObject.qop,
										   a2].join(':'), algorithm);
		return response;
	}
}
