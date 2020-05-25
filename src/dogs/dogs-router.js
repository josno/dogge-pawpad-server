require("dotenv").config();
const express = require("express");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const DogsService = require("./dogs-service");
const AuthService = require("../auth/auth-service");
const formData = require("express-form-data");
const fileParser = formData.parse();
const { requireAuth } = require("../middleware/jwt-auth");
const dogsRouter = express.Router();
const jsonBodyParser = express.json();

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

dogsRouter
	.route("/")
	.all(requireAuth)
	.get((req, res, next) => {
		DogsService.getAllDogs(req.app.get("db"))
			.then((response) => {
				res.status(200).json(response);
			})
			.catch(next);
	})
	.post(jsonBodyParser, fileParser, (req, res, next) => {
		const imgPath = req.files.profile_img.path;
		const {
			dog_name,
			age,
			gender,
			spayedneutered,
			arrival_date,
			tag_number,
			microchip,
		} = req.body;

		const requiredFields = {
			dog_name,
			spayedneutered,
			gender,
		};

		for (const [key, value] of Object.entries(requiredFields))
			if (value == null || value == undefined)
				return res.status(400).json({
					error: `Missing '${key}' in request body`,
				});

		const newDog = {
			dog_name,
			age,
			gender,
			spayedneutered,
			arrival_date,
			tag_number,
			microchip,
		};

		cloudinary.uploader
			.upload(imgPath, {
				folder: "DOG.ge",
				public_id: tag_number,
			})
			.then((result) => {
				if (!result) {
					res.status(400).json({ error: `Can't upload image.` });
				}
				newDog.profile_img = result.url;

				return DogsService.insertDog(req.app.get("db"), newDog);
			})
			.then((newDog) => {
				if (!newDog) {
					res.status(400).json({ error: `Can't add dog.` });
				}
				res
					.status(201)
					.location(path.posix.join(req.originalUrl, `/${newDog.id}`))
					.json(newDog);
			})
			.catch(next);
	});

dogsRouter
	.route("/images")
	.all(requireAuth)
	.post(jsonBodyParser, fileParser, (req, res, next) => {
		const imgPath = req.files.profile_img.path;
		const { tag_number } = req.body;
		console.log(req.body, imgPath);

		cloudinary.uploader
			.upload(imgPath, {
				folder: "DOG.ge",
				public_id: tag_number,
			})
			.then((result) => {
				if (!result) {
					res.status(400).json({ error: `Can't upload image.` });
				}
				res.status(204).json(result.url);
			})
			.catch(next);
	});
dogsRouter
	.route("/images/:tagNumber")
	.all(requireAuth)
	.delete((req, res, next) => {
		const { tagNumber } = req.params;
		cloudinary.uploader
			.destroy(`DOG.ge/${tagNumber}`)
			.then((response) => res.status(204).json("Image deleted"))
			.catch(next);
	})
	.put(jsonBodyParser, fileParser, (req, res, next) => {
		const imgPath = req.files.profile_img.path;
		const { tagNumber } = req.params;
		cloudinary.uploader
			.upload(imgPath, {
				folder: "DOG.ge",
				public_id: tagNumber,
			})
			.then((result) => {
				if (!result) {
					res.status(400).json({ error: `Can't upload image.` });
				}
				res.status(200).json(result.url);
			})
			.catch(next);
	});

dogsRouter
	.route("/:dogId")
	.all(requireAuth)
	.get((req, res, next) => {
		DogsService.getNormalizedDogData(req.app.get("db"), req.params.dogId)
			.then((response) => {
				if (!response || response.length === 0) {
					return res.status(404).json({ error: `Can't find dog.` });
				}
				return res.status(200).json(response);
			})
			.catch(next);
	})
	.patch(fileParser, jsonBodyParser, (req, res, next) => {
		const { dogId } = req.params;

		const {
			dog_name,
			age,
			profile_img,
			gender,
			spayedneutered,
			arrival_date,
		} = req.body;

		const dogToUpdate = {
			id: dogId,
			dog_name,
			age,
			profile_img,
			gender,
			spayedneutered,
			arrival_date,
		};

		const requiredFields = { dog_name, spayedneutered };

		for (const [key, value] of Object.entries(requiredFields))
			if (value == null || value == undefined)
				return res.status(400).json({
					error: `Missing '${key}' in request body`,
				});

		DogsService.getDogByDogId(req.app.get("db"), req.params.dogId)
			.then((dog) => {
				if (!dog) {
					return res.status(404).json({
						error: `Can't find dog.`,
					});
				}

				/*-----Get user information for updated by field return ----*/
				const authorization = req.headers.authorization.split(" ")[1];
				const decoded = AuthService.verifyJwt(authorization);
				const verifiedUsername = decoded.sub;

				AuthService.getUserWithUserName(req.app.get("db"), verifiedUsername)
					.then((dbUser) => {
						if (!dbUser)
							return res.status(400).json({
								error: "Incorrect username",
							});

						dogToUpdate.updated_by = dbUser.first_name;

						return DogsService.updateDogById(
							req.app.get("db"),
							dogId,
							dogToUpdate
						);
					})
					.then((returned) => {
						if (!returned) {
							return res.status(404).json({ error: `Can't find dog.` });
						}
						res.status(204).end();
					});
			})
			.catch(next);
	})
	.delete((req, res, next) => {
		const { dogId } = req.params;

		DogsService.getDogByDogId(req.app.get("db"), dogId)
			.then((dog) => {
				if (!dog || dog.length === 0) {
					return res.status(404).json({ error: `Can't find dog.` });
				}
				console.log(dog);
				cloudinary.uploader.destroy(`DOG.ge/${dog.tag_number}`);
				DogsService.deleteByDogId(req.app.get("db"), dogId).then(
					(rowsAffected) => {
						res
							.status(204)
							.json({ message: `Dog with id ${dogId} has been deleted. ` });
					}
				);
			})
			.catch(next);
	});

dogsRouter
	.route("/:dogId/archive")
	.all(requireAuth)
	.patch(jsonBodyParser, (req, res, next) => {
		const { archive_date } = req.body;
		const dogObj = {
			archive_date: new Date(archive_date).toISOString(),
			dog_status: "Archived",
		};

		DogsService.archiveDogById(req.app.get("db"), req.params.dogId, dogObj)
			.then((result) => {
				console.log(result);
				if (!result) {
					res.status(400).json({ error: `Can't update dog status.` });
				}
				res.status(200).json({ message: "Updated dog status." });
			})
			.catch(next);
	});

dogsRouter
	.route("/:dogId/adopt")
	.all(requireAuth)
	.patch(jsonBodyParser, (req, res, next) => {
		const { adoption_date } = req.body;
		const dogObj = {
			adoption_date: new Date(adoption_date).toISOString(),
			dog_status: "Adopted",
		};

		DogsService.adoptDogById(req.app.get("db"), req.params.dogId, dogObj)
			.then((result) => {
				console.log(result);
				if (!result) {
					res.status(400).json({ error: `Can't update dog status.` });
				}
				res.status(200).json({ message: "Updated dog status." });
			})
			.catch(next);
	});

module.exports = dogsRouter;
