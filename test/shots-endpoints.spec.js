const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');
const supertest = require('supertest');

describe('Shots Endpoints', function() {
	let db;

	const dogs = helpers.makeDogsArray();
	const notes = helpers.makeNotesArray();
	const shots = helpers.makeShotsArray();
	const testUsers = helpers.makeUsersArray();
	const testUser = testUsers[0];

	before('make knex instance', () => {
		db = knex({
			client: 'pg',
			connection: process.env.TEST_DATABASE_URL
		});
		app.set('db', db);
	});

	after('disconnect from db', () => db.destroy());

	before('clear tables', () => helpers.clearTables(db));

	afterEach('clear tables', () => helpers.clearTables(db));

	describe(`POST /api/v1/shots`, () => {
		context(`given there is data in the tables`, () => {
			beforeEach('Insert data into tables', () => {
				return db
					.into('dogs')
					.insert(dogs)
					.then(res => {
						return db.into('users').insert(testUsers);
					})
					.then(res => {
						return db.into('shots').insert(shots);
					})
					.then(res => {
						return db.into('notes').insert(notes);
					});
			});

			const requiredFields = ['shot_name', 'shot_iscompleted', 'dog_id'];

			requiredFields.forEach(field => {
				const dogAttemptBody = {
					shot_name: 'Test',
					shot_iscompleted: false,
					dog_id: 1
				};

				it(`responds with 400 required error when '${field}' is missing`, () => {
					delete dogAttemptBody[field]; //deletes the specified field first; then test

					return supertest(app)
						.post(`/api/v1/shots`)
						.set('Authorization', helpers.makeAuthHeader(testUser))
						.send(dogAttemptBody)
						.expect(400, {
							error: `Missing '${field}' in request body`
						});
				});
			});

			it(`responds 201 with created content `, () => {
				const newShots = helpers.makeShotToInsert();
				return supertest(app)
					.post(`/api/v1/shots`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.send(newShots)
					.expect(201);
			});
		});
	});

	describe(`GET /api/v1/shots/:dogId`, () => {
		context(`given there is data in the tables`, () => {
			beforeEach('Insert data into tables', () => {
				return db
					.into('dogs')
					.insert(dogs)
					.then(res => {
						return db.into('users').insert(testUsers);
					})
					.then(res => {
						return db.into('shots').insert(shots);
					})
					.then(res => {
						return db.into('notes').insert(notes);
					});
			});

			it(`responds 200 with a list of shots`, () => {
				const dogId = 1;

				const expectedShots = helpers.makeExpectedShots();

				return supertest(app)
					.get(`/api/v1/shots/${dogId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(200, expectedShots);
			});

			it(`responds with 404 error message when dogId doesn't exist`, () => {
				const dogId = 897;
				return supertest(app)
					.get(`/api/v1/shots/${dogId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Can't find dog.` });
			});
		});
	});

	describe.only(`PATCH /api/v1/shots/:shotId`, () => {
		context(`given there is data in the tables`, () => {
			beforeEach('Insert data into tables', () => {
				return db
					.into('dogs')
					.insert(dogs)
					.then(res => {
						return db.into('users').insert(testUsers);
					})
					.then(res => {
						return db.into('shots').insert(shots);
					})
					.then(res => {
						return db.into('notes').insert(notes);
					});
			});

			const requiredFields = ['shot_name', 'shot_iscompleted'];

			requiredFields.forEach(field => {
				const dogAttemptBody = {
					shot_name: 'Updated Shot Name',
					shot_iscompleted: false
				};

				it(`responds with 400 required error when '${field}' is missing`, () => {
					delete dogAttemptBody[field]; //deletes the specified field first; then test
					const dogId = 1;
					return supertest(app)
						.patch(`/api/v1/shots/${dogId}`)
						.set('Authorization', helpers.makeAuthHeader(testUser))
						.send(dogAttemptBody)
						.expect(400, {
							error: `Missing '${field}' in request body`
						});
				});
			});

			it(`responds with 404 error message when shotId doesn't exist`, () => {
				const shotToUpdate = helpers.makeBadShotToUpdate();
				shotToUpdate.id = 897;
				return supertest(app)
					.patch(`/api/v1/shots/${shotToUpdate.id}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.send(shotToUpdate)
					.expect(404, { error: `Can't find shot.` });
			});

			it(`responds 204 and updates content`, () => {
				const shotToUpdate = helpers.makeShotToUpdate();
				shotToUpdate.id = 1;

				return supertest(app)
					.patch(`/api/v1/shots/${shotToUpdate.id}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.send(shotToUpdate)
					.expect(204);
			});
		});
	});

	describe(`DELETE /api/v1/shots/:shotId`, () => {
		context('Given there are no games', () => {
			beforeEach('insert users', () => {
				return db.into('users').insert(testUsers);
			});

			it(`responds with 404 'Can't find shot.' if there are no shots that match the database`, () => {
				const shotId = 0;
				return supertest(app)
					.delete(`/api/v1/shots/${shotId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Can't find shot.` });
			});
		});

		context(`given there is data in the tables`, () => {
			beforeEach('Insert data into tables', () => {
				return db
					.into('dogs')
					.insert(dogs)
					.then(res => {
						return db.into('users').insert(testUsers);
					})
					.then(res => {
						return db.into('shots').insert(shots);
					})
					.then(res => {
						return db.into('notes').insert(notes);
					});
			});

			it(`responds with 204 and deletes shot`, () => {
				const shotId = 1;
				const dogId = 1;
				const shots = helpers.makeExpectedShots();
				const expectedShots = shots.filter(i => i.id != shotId);
				return supertest(app)
					.delete(`/api/v1/shots/${shotId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(204)
					.then(res => {
						supertest(app)
							.get(`/api/v1/shots/${dogId}`)
							.set(
								'Authorization',
								helpers.makeAuthHeader(testUser)
							)
							.expect(expectedShots);
					});
			});
		});
	});
});
