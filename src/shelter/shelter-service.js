const xss = require("xss");
const bcrypt = require("bcryptjs");

const ShelterService = {
	insertNewShelter(db, newShelter) {
		return db
			.insert(newShelter)
			.into("shelter")
			.returning("*")
			.then(([shelter]) => shelter);
	},
	hasUserWithUserName(db, shelter_username) {
		return db("shelter")
			.where({ shelter_username })
			.first()
			.then((user) => !!user);
	},
};

module.exports = ShelterService;
