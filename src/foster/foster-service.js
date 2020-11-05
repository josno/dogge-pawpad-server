const FosterService = {
	insertFoster(db, data) {
		return db
			.insert(data)
			.into("foster")
			.returning("*")
			.then((array) => array[0]);
	},
	deleteFoster(db, id) {
		return db.from("foster").where("dog_id", id).delete();
	},
	getFosterBydogId(db, id) {
		return db.from("foster").select("*").where("dog_id", id).first();
	},
};

module.exports = FosterService;
