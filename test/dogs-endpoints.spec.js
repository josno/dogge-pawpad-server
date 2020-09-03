const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");
const supertest = require("supertest");

describe("Dogs Endpoints", function () {
	let db;

	const dogs = helpers.makeDogsArray();
	const testUsers = helpers.makeUsersArray();
	const testUser = testUsers[0];
	const testDog = dogs[0];
	const notes = helpers.makeNotesArray();
	const shots = helpers.makeShotsArray();
	const testShelter = helpers.makeShelter();

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

	/* ------ Methods api/v1/dogs --------- */

	describe(`GET /api/v1/dogs`, () => {
		context(`Given there is no data in the tables`, () => {
			beforeEach(`Seed users`, () => {
				return db
					.into("shelter")
					.insert(testShelter)
					.then((res) => {
						return db.into("users").insert(testUsers);
					});
			});

			it(`responds with 200 and an empty list`, () => {
				return supertest(app)
					.get("/api/v1/dogs?shelterId=1")
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.expect(200, []);
			});
		});

		context(`Given there is data in the tables`, () => {
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
					})
					.then((res) => {
						return db.into("notes").insert(notes);
					});
			});

			it(`responds with 200 and a list of dogs pictures, names and image URLs`, () => {
				return supertest(app)
					.get("/api/v1/dogs?shelterId=1")
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.expect(200);
			});
		});
	});

	describe(`POST /api/v1/dogs`, () => {
		context(`Check against invalid entries with data in tables`, () => {
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

			const requiredFields = ["dog_name", "spayedneutered"];
			const newDog = helpers.makeNewDog();
			requiredFields.forEach((field) => {
				const dogAttemptBody = {
					dog_name: newDog.dog_name,
					spayedneutered: newDog.spayedneutered,
					gender: newDog.gender,
				};

				it(`responds with 400 required error when '${field}' is missing`, () => {
					delete dogAttemptBody[field]; //deletes the specified field first; then test

					return supertest(app)
						.post("/api/v1/dogs")
						.set("Authorization", helpers.makeAuthHeader(testUser))
						.field(dogAttemptBody)
						.attach("profile_img", `test/max-test-img.jpg`)
						.expect(400, {
							error: `Missing '${field}' in request body`,
						});
				});
			});
		});

		context(`Successful POST case with data in tables`, () => {
			beforeEach("Insert data into tables", () => {
				return db
					.into("users")
					.insert(testUsers)
					.then((res) => {
						db.into("dogs").insert(dogs);
					})
					.then((res) => {
						db.into("shots").insert(shots);
					})
					.then((res) => {
						db.into("notes").insert(notes);
					});
			});

			it("responds 201 with created content", () => {
				const newDog = helpers.makeNewDog();
				// helpers.seedUsers(db, testUsers);
				return supertest(app)
					.post(`/api/v1/dogs`)
					.set("Authorization", helpers.makeAuthHeader(testUsers[1]))
					.field(newDog)
					.attach("profile_img", `test/max-test-img.jpg`)
					.expect(201)
					.then((res) => {
						expect(res.body).to.have.property("id");
						expect(res.body.dog_name).to.eql(newDog.dog_name);
						expect(res.body.spayedneutered).to.be.a("boolean");
						expect(res.headers.location).to.eql(`/api/v1/dogs/${res.body.id}`);
					});
			});
		});
	});

	/* ------ Methods api/v1/dogs/:dogId --------- */

	describe(`GET api/v1/dogs/:dogId`, () => {
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

			const normalizedData = helpers.makeExpectedNormalizedData()[0];

			it(`responds with 200 with dog information`, () => {
				const dogId = 1;
				return supertest(app)
					.get(`/api/v1/dogs/${dogId}`)
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.expect(200, normalizedData);
			});

			it(`responds with 404 'Can't find dog'`, () => {
				const dogId = 98239432;
				return supertest(app)
					.get(`/api/v1/dogs/${dogId}`)
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Can't find dog.` });
			});
		});
	});

	describe(`PATCH api/v1/dogs/:dogId`, () => {
		context(`Check against invalid entries with data in tables`, () => {
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

			const requiredFields = ["dog_name"];

			requiredFields.forEach((field) => {
				const dogAttemptBody = {
					dog_name: testDog.dog_name,
					spayedneutered: testDog.spayedneutered,
					arrival_date: testDog.arrival_date,
					gender: testDog.gender,
					profile_img: testDog.profile_img,
				};

				it(`responds with 400 required error when '${field}' is missing`, () => {
					delete dogAttemptBody[field]; //deletes the specified field first; then test
					const dogId = 1;
					return supertest(app)
						.patch(`/api/v1/dogs/${dogId}`)
						.set("Authorization", helpers.makeAuthHeader(testUser))
						.send(dogAttemptBody)
						.expect(400, {
							error: `Missing '${field}' in request body`,
						});
				});
			});

			it(`responds with 404 can't find error when dogId doesn't exist in database`, () => {
				const badDogId = 92384;
				const dogAttemptBody = {
					dog_name: testDog.dog_name,
					spayedneutered: testDog.spayedneutered,
				}; //change attembody
				return supertest(app)
					.patch(`/api/v1/dogs/${badDogId}`)
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.send(dogAttemptBody)
					.expect(404, {
						error: `Can't find dog.`,
					});
			});
		});

		context(`Successful PATCH case with data in tables`, () => {
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
			it(`responds 204 No Content with updated dog`, () => {
				const dogToUpdate = helpers.makeDogToUpdate();

				return supertest(app)
					.patch(`/api/v1/dogs/${dogToUpdate.id}`)
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.send(dogToUpdate)
					.expect(204)
					.then((response) => {
						supertest(app)
							.get(`/api/v1/dogs/${dogToUpdate.id}`)
							.expect(200, dogToUpdate);
					});
			});
		});
	});

	describe(`DELETE 'api/v1/dogs/:dogId`, () => {
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
			it(`responds with 404 'Can't find game.' if there are no games that match the database`, () => {
				const dogId = 0;
				return supertest(app)
					.delete(`/api/v1/dogs/${dogId}`)
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Can't find dog.` });
			});
		});

		context(`Dog found & successful deletion`, () => {
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

			it(`Deletes specified dog, shots and notes`, () => {
				const noteId = 1;
				const dogId = 1;
				const notes = helpers.makeExpectedNotes();
				const expectedDogs = dogs.filter((n) => n.id !== noteId);
				return supertest(app)
					.delete(`/api/v1/dogs/${noteId}`)
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.expect(204)
					.then((res) => {
						supertest(app)
							.get(`/api/v1/dogs/${dogId}`)
							.set("Authorization", helpers.makeAuthHeader(testUser))
							.expect(expectedDogs);
					});
			});
		});
	});

	describe(`PATCH 'api/v1/dogs/:dogId/archive`, () => {
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

			it(`responds with 400 'Can't update dog.' if :dogId doesn't exist`, () => {
				const dogId = 0;
				const testDate = { archive_date: new Date().toISOString() };
				return supertest(app)
					.patch(`/api/v1/dogs/${dogId}/archive`)
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.send(testDate)
					.expect(400, { error: `Can't update dog status.` });
			});

			it(`responds with 200 'Dog status updated' if dogId exists`, () => {
				const dogId = 1;
				const testDate = { archive_date: new Date().toISOString() };
				return supertest(app)
					.patch(`/api/v1/dogs/${dogId}/archive`)
					.set("Authorization", helpers.makeAuthHeader(testUser))
					.send(testDate)
					.expect(200, { message: `Updated dog status.` });
			});
		});
	});
});
