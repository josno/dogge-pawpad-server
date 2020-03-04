const NotesService = {
	getNotesByDogId(db, dogId) {
		return db
			.from('notes')
			.select('*')
			.where('dog_id', dogId);
	},
	insertNote(db, newNotes) {
		return db
			.insert(newNotes)
			.into('notes')
			.returning('*')
			.then(noteArray => noteArray[0]);
	},
	getNoteByNoteId(db, id) {
		return db
			.from('notes')
			.select('*')
			.where('id', id)
			.first();
	},
	deleteByNoteId(db, id) {
		return db
			.from('notes')
			.where({ id })
			.delete();
	}
};

module.exports = NotesService;
