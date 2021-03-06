const express = require("express");
const path = require("path");
const ShotsService = require("./shots-service");
const { requireAuth } = require("../middleware/jwt-auth");
const shotsRouter = express.Router();
const jsonBodyParser = express.json();

shotsRouter
	.route("/")
	.all(requireAuth)
	.get((req, res, next) => {
		ShotsService.getShotsNameList(req.app.get("db"))
			.then((response) => {
				if (response.length === 0) {
					return res.status(404).send({ error: `Can't find shots.` });
				}
				res.status(200).json(response);
			})
			.catch(next);
	})
	.post(jsonBodyParser, (req, res, next) => {
		const { shot_name, shot_iscompleted, dog_id, shot_date } = req.body;

		const newShot = {
			shot_name,
			shot_iscompleted,
			dog_id,
			shot_date,
		};

		const requiredFields = { shot_name, shot_iscompleted, dog_id };

		for (const [key, value] of Object.entries(requiredFields))
			if (value == null || value == undefined)
				return res.status(400).json({
					error: `Missing '${key}' in request body`,
				});

		ShotsService.insertDogShot(req.app.get("db"), newShot)
			.then((newShot) => {
				if (!newShot) {
					return res.status(400).json({
						error: `Can't insert shot.`,
					});
				}

				res
					.status(201)
					.location(path.posix.join(req.originalUrl, `/${newShot.id}`))
					.json(newShot);
			})
			.catch(next);
	})
	.delete(jsonBodyParser, (req, res, next) => {
		const { dogId } = req.body;
		ShotsService.deleteShotsByDogId(req.app.get("db"), dogId)
			.then((shots) => {
				if (!shots || shots.length === 0) {
					return res.status(404).json({ error: `Can't find shots.` });
				}

				res.status(204).json(`No shots available.`);
			})
			.catch(next);
	});

shotsRouter
	.route("/dogs/:dogId") // get shots for one specific dog
	.all(requireAuth)
	.get((req, res, next) => {
		ShotsService.getDogShotsbyDogId(req.app.get("db"), req.params.dogId)
			.then((response) => {
				if (response.length === 0) {
					return res.status(404).send({ error: `Can't find dog.` });
				}
				res.status(200).json(response);
			})
			.catch(next);
	})
	.patch(jsonBodyParser, (req, res, next) => {
		const { shot_name, shot_date } = req.body;

		if (!req.params.dogId) {
			return res.status(400).json({
				error: "Missing dog id.",
			});
		}

		const requiredFields = { shot_name, shot_date };

		for (const [key, value] of Object.entries(requiredFields))
			if (value == null || value == undefined)
				return res.status(400).json({
					error: `Missing '${key}' in request body`,
				});

		ShotsService.getDogShotsbyDogId(req.app.get("db"), req.params.dogId)
			.then((response) => {
				if (response.length === 0) {
					return res.status(404).json({ error: `Can't find shot.` });
				}

				const matchingShot = response.some(
					(item) => item.shot_name === shot_name
				);
				if (!matchingShot) {
					const newShot = {
						dog_id: req.params.dogId,
						shot_name,
						shot_date,
						shot_iscompleted: true,
					};
					return ShotsService.insertDogShot(req.app.get("db"), newShot);
				} else {
					return ShotsService.updateShotByDogId(
						req.app.get("db"),
						req.params.dogId,
						shot_name,
						shot_date
					);
				}
			})
			.then((updatedShot) => {
				if (!updatedShot || updatedShot.length === 0) {
					return res.status(404).json({ error: `Can't find shot.` });
				}
				res.status(204).end();
			})
			.catch(next);
	});

shotsRouter
	.route("/:shotId")
	.all(requireAuth)
	.delete((req, res, next) => {
		ShotsService.getDogShotsbyShotId(
			//check if game exists
			res.app.get("db"),
			req.params.shotId
		)
			.then((shot) => {
				if (!shot || shot.length === 0) {
					return res.status(404).json({
						error: `Can't find shot.`,
					});
				}

				ShotsService.deleteByShotId(
					res.app.get("db"),
					req.params.shotId
				).then((affectedshot) => res.status(204).end());
			})
			.catch(next);
	})
	.patch(jsonBodyParser, (req, res, next) => {
		const { shot_name, shot_iscompleted, id, shot_date } = req.body;

		const shotToUpdate = {
			shot_name,
			shot_iscompleted,
			id,
			shot_date,
		};

		const requiredFields = { shot_name, shot_iscompleted, id };

		for (const [key, value] of Object.entries(requiredFields))
			if (value == null || value == undefined)
				return res.status(400).json({
					error: `Missing '${key}' in request body`,
				});

		ShotsService.updateDogShotByShotId(
			req.app.get("db"),
			req.params.shotId,
			shotToUpdate
		)
			.then((updatedShot) => {
				if (!updatedShot || updatedShot.length === 0) {
					return res.status(404).json({ error: `Can't find shot.` });
				}
				res.status(204).end();
			})
			.catch(next);
	});

module.exports = shotsRouter;
