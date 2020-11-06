require("dotenv").config();
const express = require("express");
const path = require("path");
const AuthService = require("../auth/auth-service");
const cloudinary = require("cloudinary").v2;
const formData = require("express-form-data");
const CryptoJS = require("crypto-js");
const fileParser = formData.parse();
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
				if (!dog || dog === undefined) {
					res.status(404).json({ error: `Can't find dog.` });
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
				DogsService.getDogByDogId(req.app.get("db"), dog_id).then((response) =>
					console.log(response)
				);
				return FosterService.insertFoster(req.app.get("db"), fosterObj);
			})
			.then((adoptionRecord) => {
				res.status(201).json({ message: "Foster completed." });
			})
			.catch(next);
	});

fosterRouter
	.route("/:dogId")
	.all(requireAuth)
	.get((req, res, next) => {
		FosterService.getFosterBydogId(req.app.get("db"), req.params.dogId)
			.then((info) => {
				console.log(info);
				!info
					? res.status(400).json({ error: `Can't find dog information.` })
					: res.status(200).send(info);
			})
			.catch(next);
	})
	.post(jsonBodyParser, (req, res, next) => {
		//return
	});

module.exports = fosterRouter;
