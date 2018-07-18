import { Request } from 'express-serve-static-core';
import * as passport from 'passport';
import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth';
import { BasicStrategy } from 'passport-http';
import { ExtractJwt, Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/user-model';
import { setReqAuthUser } from '../utils/request-util';

passport.serializeUser((user: User, done) => {
	console.log('serializeUser');
	return done(null, user.id);
});

passport.deserializeUser((id: string, done) => {
	console.log('deserializeUser');
	User.findById(id)
		.then(user => {
			return done(null, !!user ? user : false);
		})
		.catch(err => {
			return done(err, false);
		});
});

passport.use(
	'local-plugin',
	new LocalStrategy(async function(username, password, done) {
		try {
			const user = await User.findOne({ where: { username } });
			if (!user) {
				return done(null, false, { message: 'Incorrect username.' });
			}
			const isValid = await user.comparePassword(password);
			if (!isValid) {
				return done(null, false, { message: 'Incorrect password.' });
			}
			return done(null, user);
		} catch (error) {
			return done(error);
		}
	})
);

passport.use(
	'basic-plugin',
	new BasicStrategy(async function(username, password, done) {
		try {
			const user = await User.findOne({ where: { username } });
			if (!user) {
				return done(null, false);
			}
			const isValid = await user.comparePassword(password);
			if (!isValid) {
				return done(null, false);
			}
			return done(null, user);
		} catch (error) {
			return done(error);
		}
	})
);

passport.use(
	new GoogleStrategy(
		{
			clientID:
				'21905509934-bgp1qmk243hion1mt5s4qub52a7766on.apps.googleusercontent.com',
			clientSecret: 'TERflqKZSonnY6iEcZBvGTJl',
			callbackURL: 'http://localhost:8080/auth/google/callback'
		},
		async function(accessToken, refreshToken, profile, done) {
			try {
				const username = profile.id;
				// TODO: use findOrCreate
				const user = await User.findOne({ where: { username } });
				if (user) {
					return done(null, user);
				}
				const createdUser = await User.create({
					username,
					password: 'no_password'
				});
				return done(null, createdUser);
			} catch (error) {
				return done(error, false);
			}
		}
	)
);

passport.use(
	new JwtStrategy(
		{
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: 'this_is_a_secret',
			passReqToCallback: true
		},
		async function(req: Request, jwtPayload: any, done: VerifiedCallback) {
			try {
				const user = await User.findByPayload(jwtPayload);
				if (user) {
					// TODO: refactor to middleware
					setReqAuthUser(req, user);
					return done(null, user);
				}
				return done(null, false);
			} catch (error) {
				return done(error);
			}
		}
	)
);

export default passport;
