require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV, CLIENT_ORIGIN } = require("./config");
const dogsRouter = require("./dogs/dogs-router");
const notesRouter = require("./notes/notes-router");
const shotsRouter = require("./shots/shots-router");
const authRouter = require("./auth/auth-router");
const usersRouter = require("./users/users-router");
const adoptionRouter = require("./adoption/adoption-router");
const shelterRouter = require("./shelter/shelter-router");
const fosterRouter = require("./foster/foster-router");

const app = express();

const morganOption = NODE_ENV === "production" ? "tiny" : "common";

app.use(morgan(morganOption));
app.options("*", cors());
// app.use(cors("*"));
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(helmet());

app.get("/", (req, res) => {
	res.send("Hello, world!");
});

app.use("/api/v1/dogs", dogsRouter);
app.use("/api/v1/notes", notesRouter);
app.use("/api/v1/shots", shotsRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/adoption", adoptionRouter);
app.use("/api/v1/shelter", shelterRouter);
app.use("/api/v1/foster", fosterRouter);

app.use(function errorHandler(error, req, res, next) {
	let response;
	if (NODE_ENV === "production") {
		response = { error: { message: "server error" } };
	} else {
		console.error(error);
		response = { message: error.message, error };
	}
	res.status(500).json(response);
});

module.exports = app;
