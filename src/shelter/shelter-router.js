const express = require("express");
const ShelterService = require("./shelter-service");
const shelterRouter = express.Router();
const jsonBodyParser = express.json();

shelterRouter.post("/", jsonBodyParser, (req, res, next) => {
	const {
		shelter_name,
		shelter_username,
		shelter_country,
		shelter_address,
		shelter_phone,
		shelter_email,
	} = req.body;

	for (const field of [
		"shelter_name",
		"shelter_username",
		"shelter_country",
		"shelter_address",
		"shelter_phone",
		"shelter_email",
	])
		if (!req.body[field])
			return res.status(400).json({
				error: `Missing '${field}' in request body`,
			});

	// const usernameError = UsersService.validateUsername(user_name);
	// if (usernameError) return res.status(400).json({ error: usernameError });

	ShelterService.hasShelterWithUserName(req.app.get("db"), shelter_username)
		.then((shelter) => {
			if (shelter)
				return res
					.status(400)
					.json({ error: `Shelter username is already taken.` });

			const newShelter = {
				shelter_name,
				shelter_username,
				shelter_country,
				shelter_address,
				shelter_phone,
				shelter_email,
			};

			newShelter.shelter_status = "current";

			return ShelterService.insertNewShelter(
				req.app.get("db"),
				newShelter
			).then((shelter) => {
				res.status(201).send(shelter);
			});
		})
		.catch(next);
});

module.exports = shelterRouter;
