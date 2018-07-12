const passport = require('../config/passport')
const middlewares = require('../config/middlewares')

module.exports = gatewayExpressApp => {

	gatewayExpressApp.get(
		'/auth/google',
		passport.authenticate('google', { scope: ['profile'] })
	)

	gatewayExpressApp.get(
		'/auth/google/callback',
		middlewares,
		passport.authenticate('google', { failureRedirect: '/auth/google' }),
		(req, res, done) => {
			const token = req.user.generateAuthToken()
			res.json({ token })
		}
	)
}
