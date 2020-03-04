const express = require('express');
const UsersService = require('../users/users-service');
const AuthService = require('../auth/auth-service');
const usersRouter = express.Router();
const jsonBodyParser = express.json();

/*From Registration Form*/

usersRouter.post('/', jsonBodyParser, (req, res, next) => {
	const { password, user_name, last_name, first_name } = req.body;

	for (const field of ['first_name', 'last_name', 'user_name', 'password'])
		if (!req.body[field])
			return res.status(400).json({
				error: `Missing '${field}' in request body`
			});

	const usernameError = UsersService.validateUsername(user_name);
	if (usernameError) return res.status(400).json({ error: usernameError });

	const passwordError = UsersService.validatePassword(password);
	if (passwordError) return res.status(400).json({ error: passwordError });

	const firstNameError = UsersService.validateFirstName(first_name);
	if (firstNameError) return res.status(400).json({ error: firstNameError });

	const lastNameError = UsersService.validateLastName(last_name);
	if (lastNameError) return res.status(400).json({ error: lastNameError });

	UsersService.hasUserWithUserName(req.app.get('db'), user_name)
		.then(user => {
			if (user)
				return res
					.status(400)
					.json({ error: `Username is already taken.` });

			return UsersService.hashPassword(password).then(hashedPassword => {
				const newUser = {
					user_name,
					password: hashedPassword,
					first_name,
					last_name,
					date_created: 'now()'
				};

				return UsersService.insertNewUser(req.app.get('db'), newUser)
					.then(user => {
						return (serializedUser = UsersService.serializeUser(
							user
						));
					})
					.then(serializedUser => {
						const sub = serializedUser.user_name;
						const payload = { user_id: serializedUser.id };
						res.status(201).send({
							user: serializedUser,
							authToken: AuthService.createJwt(sub, payload)
						});
					});
			});
		})
		.catch(next);
});

module.exports = usersRouter;
