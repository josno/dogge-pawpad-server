require("dotenv").config();
const express = require("express");
const path = require("path");
const AuthService = require("../auth/auth-service");
const cloudinary = require("cloudinary").v2;
const formData = require("express-form-data");
const CryptoJS = require("crypto-js");
const fileParser = formData.parse();
const DogsService = require("../dogs/dogs-service");
const AdoptionService = require("./adoption-service");
const { requireAuth } = require("../middleware/jwt-auth");
const { ENCRYPTION_KEY } = require("../config");
const adoptionRouter = express.Router();
const jsonBodyParser = express.json();

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

adoptionRouter
	.route("/")
	.all(requireAuth)
	.get((req, res, next) => {
		res.status(200).send("hello");
	})
	.post(jsonBodyParser, fileParser, (req, res, next) => {
		var info = CryptoJS.AES.decrypt(req.body.data, ENCRYPTION_KEY);
		var data = JSON.parse(info.toString(CryptoJS.enc.Utf8));

		const { adopter_name, adoption_date, email, phone, country, dog_id } = data;

		const adoptionObj = {
			adoption_date,
			adopter_name,
			adopter_email: email,
			adopter_phone: phone,
			adopter_country: country,
			dog_id,
		};

		(async () => {
			let responseJson;
			if (req.files.contract) {
				const imgPath = req.files.contract.path;
				let response = await cloudinary.uploader.upload(imgPath, {
					folder: "DOG.ge/Contract_Images",
					public_id: dog_id,
				});
				responseJson = await response;
			} else {
				responseJson = null;
			}

			return responseJson;
		})()
			.then((result) => {
				result === null
					? (adoptionObj.contract_img_url = result)
					: (adoptionObj.contract_img_url = result.secure_url);

				return DogsService.getDogByDogId(req.app.get("db"), dog_id);
			})
			.then((dog) => {
				if (!dog || dog === undefined) {
					res.status(404).json({ error: `Can't find dog.` });
				} else {
					const updateDogObj = {
						dog_name: dog.dog_name,
						dog_status: "Adopted",
					};
					return DogsService.updateDogById(
						req.app.get("db"),
						dog.id,
						updateDogObj
					);
				}
			})
			.then((res) => {
				return AdoptionService.insertAdoption(req.app.get("db"), adoptionObj);
			})
			.then((adoptionRecord) => {
				// console.log(adoptionRecord);
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
			.then((response) => {
				if (!response) {
					res.status(400).json({ error: `Can't find adoption information.` });
				}

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
				if (!dog || dog.length === 0) {
					return res.status(404).json({ error: `Can't find dog.` });
				} else {
					const updateDogObj = {
						dog_name: dog.dog_name,
						dog_status: "Current",
					};
					return DogsService.updateDogById(
						req.app.get("db"),
						dog.id,
						updateDogObj
					);
				}
			})
			.then((res) => {
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

adoptionRouter
	.route("/contract-upload/:dogId")
	.all(requireAuth)
	.put(jsonBodyParser, fileParser, (req, res, next) => {
		const imgPath = req.files.contract.path;
		const { dogId } = req.params;

		const updatedAdoption = {};
		cloudinary.uploader
			.upload(imgPath, {
				folder: "DOG.ge",
				public_id: `${dogId}-contract`,
			})
			.then((result) => {
				if (!result) {
					res.status(400).json({ error: `Can't upload image.` });
				}

				updatedAdoption.contract_img_url = result.secure_url;
				return AdoptionService.updateAdoptionImg(
					req.app.get("db"),
					req.params.dogId,
					updatedAdoption
				);
			})
			.then((response) => res.status(200).json({ message: "Contract Updated" }))
			.catch(next);
	});

module.exports = adoptionRouter;
