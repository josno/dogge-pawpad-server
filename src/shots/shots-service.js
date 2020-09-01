const ShotsService = {
	getDogShotsbyDogId(db, dogId) {
		return db.from("shots").select("*").where("dog_id", dogId);
	},
	updateDogShotByShotId(db, id, shot) {
		return db.from("shots").where("id", id).update(shot);
	},
	insertDogShot(db, newShot) {
		return db
			.insert(newShot)
			.into("shots")
			.returning("*")
			.then((shotsArray) => shotsArray[0]);
	},
	deleteByShotId(db, id) {
		return db.from("shots").where({ id }).delete();
	},
	getDogShotsbyShotId(db, id) {
		return db.from("shots").select("*").where("id", id).first();
	},
	deleteShotsByDogId(db, dogId) {
		return db.from("shots").where("dog_id", dogId).delete();
	},
	getShotsNameList(db) {
		return db.from("shots").distinct("shot_name");
	},
};

module.exports = ShotsService;
