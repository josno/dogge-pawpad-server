const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");
const supertest = require("supertest");
const { expect } = require("chai");

describe.only("Shots Endpoints", function () {
	let db;

	const dogs = helpers.makeDogsArray();
	const testUsers = helpers.makeUsersArray();
	const testUser = testUsers[0];
	const testDog = dogs[0];
	const notes = helpers.makeNotesArray();
	const shots = helpers.makeShotsArray();
	const testShelter = helpers.makeShelter();
	const exampleShotToUpdateById = helpers.makeShotUpdateByDogId();

	before("make knex instance", () => {
		db = knex({
			client: "pg",
			connection: process.env.TEST_DATABASE_URL,
		});
		app.set("db", db);
	});

	after("disconnect from db", () => db.destroy());

	before("clear tables", () => helpers.clearTables(db));

	afterEach("clear tables", () => helpers.clearTables(db));

	describe(`POST /api/v1/shots`, () => {
		context(`given there is data in the tables`, () => {
			beforeEach("Insert data into tables", () => {
				return db
					.into("dogs")
					.insert(dogs)
					.then((res) => {
						return db.into("users").insert(testUsers);
					})
					.then((res) => {
						return db.into("shots").insert(shots);
					})
					.then((res) => {
						return db.into("notes").insert(notes);
					});
			});

			const requiredFields = ["shot_name", "shot_iscompleted", "dog_id"];

			requiredFields.forEach((field) => {
				const dogAttemptBody = {
					shot_name: "Test",
					shot_iscompleted: false,
					dog_id: 1,
				};

				it(`responds with 400 required error when '${field}' is missing`, () => {
					delete dogAttemptBody[field]; //deletes the specified field first; then test

					return supertest(app)
						.post(`/api/v1/shots`)
						.set("Authorization", helpers.makeAuthHeader(testUser))
						.send(dogAttemptBody)
						.expect(400, {
							error: `Missing '${field}' in request body`,
						});
				});
			});

			it(`responds 201 with created content `, () => {
				const newShots = helpers.makeShotToInsert();
				return supertest(app)
					.post(`/api/v1/shots`)
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.send(newShots)
					.expect(201);
			});
		});
	});

	describe(`GET /api/v1/shots/dogs/:dogId`, () => {
		context(`given there is data in the tables`, () => {
			beforeEach("Insert data into tables", () => {
				return db
					.into("dogs")
					.insert(dogs)
					.then((res) => {
						return db.into("users").insert(testUsers);
					})
					.then((res) => {
						return db.into("shots").insert(shots);
					})
					.then((res) => {
						return db.into("notes").insert(notes);
					});
			});

			it(`responds 200 with a list of shots`, () => {
				const dogId = 1;

				const expectedShots = helpers.makeExpectedShots();

				return supertest(app)
					.get(`/api/v1/shots/dogs/${dogId}`)
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.expect(200, expectedShots);
			});

			it(`responds with 404 error message when dogId doesn't exist`, () => {
				const dogId = 897;
				return supertest(app)
					.get(`/api/v1/shots/dogs/${dogId}`)
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Can't find dog.` });
			});
		});
	});

	describe(`PATCH /api/v1/shots/:shotId`, () => {
		context(`given there is data in the tables`, () => {
			beforeEach("Insert data into tables", () => {
				return db
					.into("dogs")
					.insert(dogs)
					.then((res) => {
						return db.into("users").insert(testUsers);
					})
					.then((res) => {
						return db.into("shots").insert(shots);
					})
					.then((res) => {
						return db.into("notes").insert(notes);
					});
			});

			const requiredFields = ["shot_name", "shot_iscompleted"];

			requiredFields.forEach((field) => {
				const dogAttemptBody = {
					shot_name: "Updated Shot Name",
					shot_iscompleted: false,
				};

				it(`responds with 400 required error when '${field}' is missing`, () => {
					delete dogAttemptBody[field]; //deletes the specified field first; then test
					const dogId = 1;
					return supertest(app)
						.patch(`/api/v1/shots/${dogId}`)
						.set("Authorization", helpers.makeAuthHeader(testUser))
						.send(dogAttemptBody)
						.expect(400, {
							error: `Missing '${field}' in request body`,
						});
				});
			});

			it(`responds with 404 error message when shotId doesn't exist`, () => {
				const shotToUpdate = helpers.makeBadShotToUpdate();
				shotToUpdate.id = 897;
				return supertest(app)
					.patch(`/api/v1/shots/${shotToUpdate.id}`)
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.send(shotToUpdate)
					.expect(404, { error: `Can't find shot.` });
			});

			it(`responds 204 and updates content`, () => {
				const shotToUpdate = helpers.makeShotToUpdate();
				shotToUpdate.id = 1;

				return supertest(app)
					.patch(`/api/v1/shots/${shotToUpdate.id}`)
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.send(shotToUpdate)
					.expect(204);
			});
		});
	});

	describe(`DELETE /api/v1/shots/:shotId`, () => {
		context("Given there are no shots", () => {
			beforeEach("insert users", () => {
				return db.into("users").insert(testUsers);
			});

			it(`responds with 404 'Can't find shot.' if there are no shots that match the database`, () => {
				const shotId = 0;
				return supertest(app)
					.delete(`/api/v1/shots/${shotId}`)
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Can't find shot.` });
			});
		});

		context(`given there is data in the tables`, () => {
			beforeEach("Insert data into tables", () => {
				return db
					.into("dogs")
					.insert(dogs)
					.then((res) => {
						return db.into("users").insert(testUsers);
					})
					.then((res) => {
						return db.into("shots").insert(shots);
					})
					.then((res) => {
						return db.into("notes").insert(notes);
					});
			});

			it(`responds with 204 and deletes shot`, () => {
				const shotId = 1;
				const dogId = 1;
				const shots = helpers.makeExpectedShots();
				const expectedShots = shots.filter((i) => i.id != shotId);
				return supertest(app)
					.delete(`/api/v1/shots/${shotId}`)
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.expect(204)
					.then((res) => {
						supertest(app)
							.get(`/api/v1/shots/${dogId}`)
							.set("Authorization", helpers.makeAuthHeader(testUser))
							.expect(expectedShots);
					});
			});
		});
	});

	describe(`GET /api/v1/shots/shotnames`, () => {
		context("Given there are no shots", () => {
			beforeEach("Insert data into tables", () => {
				return db
					.into("shelter")
					.insert(testShelter)
					.then((res) => {
						return db.into("dogs").insert(dogs);
					})
					.then((res) => {
						return db.into("users").insert(testUsers);
					});
			});

			it(`responds with 404 'Can't find shots.' if there are no shots that match the database`, () => {
				return supertest(app)
					.get(`/api/v1/shots`)
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Can't find shots.` });
			});
		});

		context("Given there are shots in databse", () => {
			beforeEach("Insert data into tables", () => {
				return db
					.into("shelter")
					.insert(testShelter)
					.then((res) => {
						return db.into("dogs").insert(dogs);
					})
					.then((res) => {
						return db.into("users").insert(testUsers);
					})
					.then((res) => {
						return db.into("shots").insert(shots);
					});
			});

			it(`responds with 200 with list of shots`, () => {
				return supertest(app)
					.get(`/api/v1/shots`)
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.expect(200);
			});
		});
	});

	describe(`PATCH /api/v1/shots/dogs/:dogId`, () => {
		context("Given there are no shots", () => {
			beforeEach("Insert data into tables", () => {
				return db
					.into("shelter")
					.insert(testShelter)
					.then((res) => {
						return db.into("dogs").insert(dogs);
					})
					.then((res) => {
						return db.into("users").insert(testUsers);
					});
			});

			it(`responds with 404 'Can't find shot.' if there are no shot that match the database`, () => {
				const dogId = testDog.id;
				return supertest(app)
					.patch(`/api/v1/shots/dogs/${dogId}`)
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.send(exampleShotToUpdateById)
					.expect(404, { error: `Can't find shot.` });
			});
		});

		context("Given there are shots in database", () => {
			beforeEach("Insert data into tables", () => {
				return db
					.into("shelter")
					.insert(testShelter)
					.then((res) => {
						return db.into("dogs").insert(dogs);
					})
					.then((res) => {
						return db.into("users").insert(testUsers);
					})
					.then((res) => {
						return db.into("shots").insert(shots);
					});
			});

			const requiredFields = ["shot_name", "shot_date"];

			requiredFields.forEach((field) => {
				const dogAttemptBody = {
					shot_name: "Updated Shot Name",
					shot_date: new Date(),
				};

				it(`responds with 400 required error when '${field}' is missing`, () => {
					delete dogAttemptBody[field]; //deletes the specified field first; then test
					const dogId = 1;
					return supertest(app)
						.patch(`/api/v1/shots/dogs/${dogId}`)
						.set("Authorization", helpers.makeAuthHeader(testUser))
						.send(dogAttemptBody)
						.expect(400, {
							error: `Missing '${field}' in request body`,
						});
				});
			});

			it(`updates the shot with new information`, () => {
				const dogId = testDog.id;
				return supertest(app)
					.patch(`/api/v1/shots/dogs/${dogId}`)
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.send(exampleShotToUpdateById)
					.expect(204)
					.then((response) => {
						return supertest(app)
							.get(`/api/v1/shots/dogs/${dogId}`)
							.set("Authorization", helpers.makeAuthHeader(testUser))
							.expect(200);
					})
					.then((res) => {
						const updatedShot = res.body.find(
							(shot) => shot.shot_name === exampleShotToUpdateById.shot_name
						);
						expect(updatedShot.shot_name).to.eql(
							exampleShotToUpdateById.shot_name
						);
						expect(updatedShot.shot_date).to.include(
							exampleShotToUpdateById.shot_date
						);
						expect(updatedShot.shot_iscompleted).to.eql(true);
					});
			});
		});
	});
});
