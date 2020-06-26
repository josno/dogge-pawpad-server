const AdoptionService = {
	insertAdoption(db, data) {
		return db
			.insert(data)
			.into("adoption")
			.returning("*")
			.then((array) => array[0]);
	},
	deleteAdoption(db, id) {
		return db.from("adoption").where("dog_id", id).delete();
	},
	getAdoptionBydogId(db, id) {
		return db.from("adoption").select("*").where("dog_id", id).first();
	},
	updateAdoptionImg(db, id, adoption_url) {
		return db
			.from("adoption")
			.where("dog_id", id)
			.update(adoption_url, ["dog_id", "contract_img_url"]);
	},
};

module.exports = AdoptionService;
