const AdoptionService = {
	insertAdoption(db, data) {
		return db
			.insert(data)
			.into("adoption")
			.returning("*")
			.then((array) => array[0]);
	},
};

module.exports = AdoptionService;
