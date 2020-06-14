const AdoptionService = {
	insertAdoption(db, data) {
		return db
			.insert(data)
			.into("adoption")
			.returning("*")
			.then((array) => array[0]);
	},
	deleteAdoption(db, id) {
		return db.from("adoption").where({ id }).delete();
	},
	getAdoptionBydogId(db, id) {
		return db.from("adoption").select("*").where("dog_id", id).first();
	},
};

module.exports = AdoptionService;
