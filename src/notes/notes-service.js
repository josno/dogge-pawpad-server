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
	}
};

module.exports = NotesService;
