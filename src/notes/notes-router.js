const express = require("express");
const path = require("path");
const NotesService = require("./notes-service");
const AuthService = require("../auth/auth-service");
const { requireAuth } = require("../middleware/jwt-auth");
const notesRouter = express.Router();
const jsonBodyParser = express.json();

notesRouter
	.route("/")
	.all(requireAuth)
	.post(jsonBodyParser, (req, res, next) => {
		const { type_of_note, notes, dog_id } = req.body;
		const newNote = {
			type_of_note,
			notes,
			dog_id,
		};

		const requiredFields = { type_of_note, notes, dog_id };

		for (const [key, value] of Object.entries(requiredFields))
			if (value == null || value == undefined)
				return res.status(400).json({
					error: `Missing '${key}' in request body`,
				});

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

				newNote.created_by = dbUser.id;
				newNote.note_updated_by = dbUser.first_name;

				return NotesService.insertNote(req.app.get("db"), newNote);
			})
			.then((addedNote) => {
				res
					.status(201)
					.location(path.posix.join(req.originalUrl, `/${addedNote.id}`))
					.json(addedNote);
			})
			.catch(next);
	})
	.delete(jsonBodyParser, (req, res, next) => {
		const { dogId } = req.body;
		NotesService.deleteNoteByDogId(req.app.get("db"), dogId)
			.then((note) => {
				if (!note || note.length === 0) {
					return res.status(404).json({ error: `Can't find note.` });
				}

				res.status(204).end();
			})
			.catch(next);
	});

notesRouter
	.route("/:dogId")
	.all(requireAuth)
	.get((req, res, next) => {
		const { dogId } = req.params;
		NotesService.getNotesByDogId(req.app.get("db"), dogId)
			.then((notes) => res.status(200).json(notes))
			.catch(next);
	});

notesRouter
	.route("/:noteId")
	.all(requireAuth)
	.delete((req, res, next) => {
		NotesService.getNoteByNoteId(req.app.get("db"), req.params.noteId)
			.then((note) => {
				if (!note || note.length === 0) {
					return res.status(404).json({ error: `Can't find note.` });
				}

				NotesService.deleteByNoteId(
					req.app.get("db"),
					req.params.noteId
				).then((deletedNote) => res.status(204).end());
			})
			.catch(next);
	});
module.exports = notesRouter;
