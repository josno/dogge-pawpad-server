require("dotenv").config();
const express = require("express");

const AuthService = require("../auth/auth-service");

const { requireAuth } = require("../middleware/jwt-auth");
const adoptionRouter = express.Router();
const jsonBodyParser = express.json();

adoptionRouter
	.route("/")
	.all(requireAuth)
	.get((req, res, next) => {
		res.status(200).json("adoption endpoint");
	});

module.exports = adoptionRouter;
