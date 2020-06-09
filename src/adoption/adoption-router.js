require("dotenv").config();
const express = require("express");
const path = require("path");
const AuthService = require("../auth/auth-service");
const DogsService = require("../dogs/dogs-service");
const AdoptionService = require("./adoption-service");
const { requireAuth } = require("../middleware/jwt-auth");
const adoptionRouter = express.Router();
const jsonBodyParser = express.json();

adoptionRouter
	.route("/")
	.all(requireAuth)
	.get((req, res, next) => {
		res.status(200).send("hello");
	})
	.post(jsonBodyParser, (req, res, next) => {
		const {
			adoption_date,
			adopter_name,
			adopter_email,
			adopter_phone,
			adopter_country,
			adopter_address,
			dog_id,
		} = req.body;

		const adoptionObj = {
			adoption_date,
			adopter_name,
			adopter_email,
			adopter_phone,
			adopter_country,
			adopter_address,
			dog_id,
		};

		DogsService.getDogByDogId(req.app.get("db"), req.body.dog_id)
			.then((response) => {
				if (!response || response === undefined) {
					res.status(404).json({ error: `Can't find dog.` });
				} else {
					return AdoptionService.insertAdoption(req.app.get("db"), adoptionObj);
				}
			})
			.then((adoptionRecord) => {
				if (!adoptionRecord) {
					res.status(400).json({ error: `Can't add adoption details.` });
				}
				res
					.status(201)
					.location(path.posix.join(req.originalUrl, `/${adoptionRecord.id}`))
					.json(adoptionRecord);
			})
			.catch(next);
	});

module.exports = adoptionRouter;
