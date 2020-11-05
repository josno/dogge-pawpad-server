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
	.get((req, res, next) => {
		res.status(200).send("Hello");
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
