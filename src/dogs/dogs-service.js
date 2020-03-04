const DogsService = {
	getAllDogs(db) {
		return db.from('dogs').select('id', 'profile_img', 'dog_name');
	},
	getDogByDogId(db, id) {
		return db
			.from('dogs')
			.select('*')
			.where('id', id)
			.first();
	},
	getNormalizedDogData(db, id) {
		return db
			.from('dogs')
			.select(
				'dogs.id',
				'dogs.dog_name',
				'dogs.profile_img',
				'dogs.age',
				'dogs.arrival_date',
				'dogs.gender',
				'dogs.spayedneutered',
				'dogs.updated_by',
				db.raw(
					`array_agg(
						json_build_object(
							'shot_name', shots.shot_name,
							'shot_iscompleted', shots.shot_iscompleted
						))
					AS "shotsCompleted"`
				)
			)
			.where('dogs.id', id)
			.leftJoin('shots as shots', 'shots.dog_id', 'dogs.id')
			.groupBy(
				'shots.dog_id',
				'dogs.id',
				'dogs.dog_name',
				'dogs.profile_img',
				'dogs.age',
				'dogs.arrival_date',
				'dogs.gender',
				'dogs.spayedneutered',
				'dogs.updated_by'
			)
			.then(dogArray => dogArray[0]);
	},
	insertDog(db, newDog) {
		return db
			.insert(newDog)
			.into('dogs')
			.returning('*')
			.then(dogArray => dogArray[0]);
	},
	updateDogById(db, id, dog) {
		return db
			.from('dogs')
			.where('id', id)
			.update(dog);
	}
};
module.exports = DogsService;
