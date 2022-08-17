import express from 'express';
import passport from 'passport';
import { DigestStrategy } from 'passport-http';


export const getServer = () => {
	const app = express();

	type UserInfo = {
		username: string,
		password: string,
	}


	type cb = (err?: any, user?: UserInfo | boolean, password?: string) => any

	abstract class User {
		public static findOne(user: any, callback: cb) {
			return callback(null,  { password: "test", username: user.username });
		}
	}


	passport.use(new DigestStrategy(
		{ realm: 'brightsign', algorithm: 'MD5', qop: 'auth' },
		(username: string, done: cb) => {
			User.findOne({username: username}, (err, user) => {
				if (err) return done(err);
				if (user && typeof user !== 'boolean') return done(null, user, user.password);
				else return done(null, false);
			});
		},
		(params, done: (err: any, valid: boolean) => any) => {
			done(undefined, true);
		}
	));

	app.get('/digest',
			passport.authenticate('digest', {session: false}),
			(req, res) => {
				res.json(req.user);
	});
	return app;
}
