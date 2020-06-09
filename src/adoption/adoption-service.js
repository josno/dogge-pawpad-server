const AdoptionService = {
	insertAdoption(db, data) {
		return db.insert(data).into("adoption").returning("*");
	},
};
