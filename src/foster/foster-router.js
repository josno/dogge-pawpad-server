require("dotenv").config();
const express = require("express");
const path = require("path");
const AuthService = require("../auth/auth-service");
const cloudinary = require("cloudinary").v2;
const formData = require("express-form-data");
const CryptoJS = require("crypto-js");
const fileParser = formData.parse();
const DogsService = require("../dogs/dogs-service");
const FosterService = require("./foster-service");
const { requireAuth } = require("../middleware/jwt-auth");
const { ENCRYPTION_KEY } = require("../config");
const fosterRouter = express.Router();
const jsonBodyParser = express.json();

fosterRouter
	.route("/")
	.all(requireAuth)
	.post(jsonBodyParser, fileParser, (req, res, next) => {
		let info = CryptoJS.AES.decrypt(req.body.data, ENCRYPTION_KEY);
		let data = JSON.parse(info.toString(CryptoJS.enc.Utf8));

		const {
			foster_name,
			foster_date,
			foster_email,
			foster_phone,
			foster_country,
			dog_id,
		} = data;

		const fosterObj = {
			foster_date,
			foster_name,
			foster_email,
			foster_phone,
			foster_country,
			dog_id,
		};

		(async () => {
			let responseJson = null;
			if (req.files.contract) {
				const imgPath = req.files.contract.path;
				let response = await cloudinary.uploader.upload(imgPath, {
					folder: "DOG.ge/Foster_Files",
					public_id: `${dog_id}-foster-contract`,
				});
				const resolved = await response;
				responseJson = resolved;
			}
			return responseJson;
		})()
			.then((result) => {
				result === null
					? (fosterObj.contract_url = result)
					: (fosterObj.contract_url = result.secure_url);

				return DogsService.getDogByDogId(req.app.get("db"), dog_id);
			})
			.then((dog) => {
				if (!dog) {
					return res
						.status(404)
						.json({ error: `It doesn't look like dog exists.` });
				} else {
					const updateDogObj = {
						dog_name: dog.dog_name,
						dog_status: "Fostered",
					};
					return DogsService.updateDogById(
						req.app.get("db"),
						dog.id,
						updateDogObj
					);
				}
			})
			.then((res) => {
				return FosterService.insertFoster(req.app.get("db"), fosterObj);
			})
			.then((record) => {
				!record
					? res.status(400).json({ message: "Dog cannot be fostered." })
					: res.status(201).json({ message: "Foster completed." });
			})
			.catch(next);
	});

fosterRouter
	.route("/:dogId")
	.all(requireAuth)
	.get((req, res, next) => {
		FosterService.getFosterBydogId(req.app.get("db"), req.params.dogId)
			.then((response) => {
				if (!response) {
					return res
						.status(400)
						.json({ error: `Can't find foster information.` });
				}

				response.dog_status = "Fostered";

				const ciphertext = CryptoJS.AES.encrypt(
					JSON.stringify(response),
					ENCRYPTION_KEY
				).toString();

				const responseObj = { data: ciphertext };

				res.status(200).json(responseObj);
			})

			.catch(next);
	})
	.delete((req, res, next) => {
		DogsService.getDogByDogId(req.app.get("db"), req.params.dogId)
			.then((dog) => {
				if (!dog) {
					return res.status(404).json({ error: `Can't find dog.` });
				}

				const updateDogObj = {
					dog_name: dog.dog_name,
					dog_status: "Current",
				};
				return DogsService.updateDogById(
					req.app.get("db"),
					dog.id,
					updateDogObj
				);
			})
			.then((updatedDog) => {
				return FosterService.deleteFoster(req.app.get("db"), req.params.dogId);
			})
			.then((deletedFoster) => {
				res.status(204).end();
			})
			.catch(next);
	});

module.exports = fosterRouter;
