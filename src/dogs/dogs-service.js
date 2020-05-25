const DogsService = {
	getAllDogs(db) {
		return db.from("dogs").select("id", "profile_img", "dog_name");
	},
	getDogByDogId(db, id) {
		return db.from("dogs").select("*").where("id", id).first();
	},
	getNormalizedDogData(db, id) {
		return db
			.from("dogs")
			.select(
				"dogs.id",
				"dogs.dog_name",
				"dogs.profile_img",
				"dogs.age",
				"dogs.arrival_date",
				"dogs.gender",
				"dogs.spayedneutered",
				"dogs.updated_by",
				"dogs.tag_number",
				"dogs.microchip",
				db.raw(
					`array_agg(
						json_build_object(
							'shot_name', shots.shot_name,
							'shot_iscompleted', shots.shot_iscompleted,
							'shot_date', shots.shot_date
						))
					AS "shotsCompleted"`
				)
			)
			.where("dogs.id", id)
			.leftJoin("shots as shots", "shots.dog_id", "dogs.id")
			.groupBy(
				"shots.dog_id",
				"dogs.id",
				"dogs.dog_name",
				"dogs.profile_img",
				"dogs.age",
				"dogs.arrival_date",
				"dogs.gender",
				"dogs.spayedneutered",
				"dogs.updated_by",
				"dogs.tag_number",
				"dogs.microchip"
			)
			.then((dogArray) => dogArray[0]);
	},
	insertDog(db, newDog) {
		return db
			.insert(newDog)
			.into("dogs")
			.returning("*")
			.then((dogArray) => dogArray[0]);
	},
	updateDogById(db, id, dog) {
		return db.from("dogs").where("id", id).update(dog);
	},
	deleteByDogId(db, id) {
		return db.from("dogs").where({ id }).delete();
	},
	archiveDogById(db, id, date) {
		return db
			.from("dogs")
			.where("id", id)
			.update({ dog_status: "Archived", archive_date: date }, [
				"id",
				"dog_status",
			]);
	},
	adoptDogById(db, id, date) {
		return db
			.from("dogs")
			.where("id", id)
			.update({ dog_status: "Adopted", adoption_date: date }, [
				"id",
				"dog_status",
			]);
	},
};
module.exports = DogsService;
