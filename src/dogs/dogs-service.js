const DogsService = {
  getAllDogs(db) {
    return db
      .from('dogs')
      .select(
        'id',
        'profile_img',
        'dog_name',
        'dog_status',
        'tag_number',
        'age',
        'gender'
      )
  },
  getAllDogsByShelterId(db, shelterId) {
    return db
      .from('dogs')
      .select(
        'id',
        'profile_img',
        'dog_name',
        'dog_status',
        'tag_number',
        'age',
        'gender'
      )
      .where('shelter_id', shelterId)
  },
  getDogByDogId(db, id) {
    return db.from('dogs').select('*').where('id', id).first()
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
        'dogs.tag_number',
        'dogs.microchip',
        'dogs.microchip_date',
        'dogs.dog_status',
        'dogs.archive_date',
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
        'dogs.updated_by',
        'dogs.tag_number',
        'dogs.microchip',
        'dogs.microchip_date',
        'dogs.dog_status',
        'dogs.archive_date'
      )
      .then((dogArray) => dogArray[0])
  },
  insertDog(db, newDog) {
    return db
      .insert(newDog)
      .into('dogs')
      .returning('*')
      .then((dogArray) => dogArray[0])
  },
  updateDogById(db, id, dog) {
    return db
      .from('dogs')
      .where('id', id)
      .update(dog)
      .returning('*')
      .then((dogArray) => dogArray[0].id)
  },
  getStatusById(db, id) {
    return db
      .from('dogs')
      .select('dogs.dog_status')
      .where('dogs.id', id)
      .then((dogArray) => dogArray[0])
  },
  deleteByDogId(db, id) {
    return db.from('dogs').where({ id }).delete()
  },
  archiveDogById(db, id, dog) {
    return db.from('dogs').where('id', id).update(dog, ['id', 'dog_status'])
  },
  adoptDogById(db, id, dog) {
    return db.from('dogs').where('id', id).update(dog, ['id', 'dog_status'])
  },
  getDogList(db, shelterId) {
    return db
      .from('dogs')
      .select(
        'dogs.id',
        'dogs.dog_name',
        'dogs.profile_img',
        'dogs.age',
        'dogs.arrival_date',
        'dogs.gender',
        'dogs.tag_number',
        'dogs.microchip',
        'dogs.microchip_date',
        'dogs.dog_status',
        db.raw(
          `json_agg(
							json_build_object(
								'shot_name', shots.shot_name, 
								'shot_date', shots.shot_date
							))
						AS "shotsCompleted"`
        )
      )
      .where('dogs.shelter_id', shelterId)
      .leftJoin('shots as shots', 'shots.dog_id', 'dogs.id')
      .groupBy(
        'shots.dog_id',
        'dogs.id',
        'dogs.dog_name',
        'dogs.profile_img',
        'dogs.age',
        'dogs.arrival_date',
        'dogs.gender',
        'dogs.tag_number',
        'dogs.microchip',
        'dogs.microchip_date',
        'dogs.dog_status'
      )
      .then((dogArray) => dogArray)
  },
}
module.exports = DogsService
