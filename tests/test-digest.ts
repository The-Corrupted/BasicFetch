import { BasicFetch } from '../src/index';
import { DigestStrategy } from 'passport-http';
import { Result } from '../src/result';
import { Digest } from '../src/auth';
import { getServer } from './server';

describe('Test digest authentication', () => {
	it('should authenticate', async () => {
		const app = getServer();
		const server = app.listen(3340, '0.0.0.0');
		let result = await new BasicFetch('0.0.0.0')
			.port(3340)
			.path('/digest')
			.send_digest('admin', 'test');
		server.close();
		let response;
		if (result.ok === true) response = result.value;
		else {
			console.log(result.error.message);
			throw new Error('Failed');
		}
		let statusCode = response.statusCode;
		expect(statusCode).toEqual(200);
	});
})
