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
				res
					.status(201)
					.location(path.posix.join(req.originalUrl, `/${adoptionRecord.id}`))
					.json(adoptionRecord);
			})
			.catch(next);
	});

adoptionRouter
	.route("/:dogId")
	.all(requireAuth)
	.get((req, res, next) => {
		AdoptionService.getAdoptionBydogId(req.app.get("db"), req.params.dogId)
			.then((response) => res.status(200).json(response))
			.catch(next);
	})
	.delete((req, res, next) => {
		DogsService.getDogByDogId(req.app.get("db"), req.params.dogId)
			.then((dog) => {
				if (!dog || dog.length === 0) {
					return res.status(404).json({ error: `Can't find dog.` });
				}

				return AdoptionService.deleteAdoption(
					req.app.get("db"),
					req.params.dogId
				);
			})
			.then((response) => {
				res.status(204).end();
			})
			.catch(next);
	});

module.exports = adoptionRouter;
