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
	hasShelterWithUserName(db, shelter_username) {
		return db("shelter")
			.where({ shelter_username })
			.first()
			.then((shelter) => !!shelter);
	},
};

module.exports = ShelterService;
