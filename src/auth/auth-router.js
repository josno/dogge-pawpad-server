const express = require("express");
const AuthService = require("./auth-service");
const CryptoJS = require("crypto-js");
const authRouter = express.Router();
const jsonBodyParser = express.json();
const { ENCRYPTION_KEY } = require("../config");

authRouter.post("/login", jsonBodyParser, (req, res, next) => {
	const { user_name, password, shelter_username } = req.body;
	const loginUser = { user_name, password, shelter_username };

	for (const [key, value] of Object.entries(loginUser))
		if (value == null)
			return res.status(400).json({
				error: `Missing '${key}' in request body`,
			});

	Promise.all([
		AuthService.getUserWithUserName(req.app.get("db"), loginUser.user_name),
		AuthService.getShelterByUsername(
			req.app.get("db"),
			loginUser.shelter_username
		),
	])
		.then((responseArray) => {
			const dbUser = responseArray[0];
			const shelterInfo = responseArray[1];

			if (!dbUser)
				return res.status(400).json({
					error: "Incorrect username or password",
				});

			if (!shelterInfo || shelterInfo.id !== dbUser.shelter_id)
				return res.status(400).json({
					error: "Shelter missing or does not match.",
				});

			return AuthService.comparePasswords(
				loginUser.password,
				dbUser.password
			).then((compareMatch) => {
				if (!compareMatch)
					return res.status(400).json({
						error: "Incorrect username or password",
					});

				const sub = dbUser.user_name;
				const payload = { user_id: dbUser.id };

				let ciphertext = CryptoJS.AES.encrypt(
					JSON.stringify(dbUser.shelter_id),
					ENCRYPTION_KEY
				).toString();

				res.status(200).send({
					authToken: AuthService.createJwt(sub, payload),
					shelterId: ciphertext,
				});
			});
		})
		.catch(next);
});

module.exports = authRouter;
