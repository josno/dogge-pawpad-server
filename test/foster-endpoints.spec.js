const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");
const supertest = require("supertest");

describe("Foster endpoints", () => {
	let db;

	const testUsers = helpers.makeUsersArray();
	const dogs = helpers.makeDogsArray();
	const shots = helpers.makeShotsArray();
	const notes = helpers.makeNotesArray();
	const testFoster = helpers.makeNewFoster();
	const fosterList = helpers.makeFosterArray();
	const encryptedFoster = helpers.makeEncryptedFoster();

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

	describe("GET /foster/:dogId", () => {
		context(`Given there is no data in the tables`, () => {
			beforeEach(`Seed users`, () => {
				helpers.seedUsers(db, testUsers);
			});

			it(`responds with 400 Can't find adoption information`, () => {
				const dogTestId = 0;
				return supertest(app)
					.get(`/api/v1/foster/${dogTestId}`)
					.set("Authorization", helpers.makeAuthHeader(testUsers[0]))
					.expect(400, { error: `Can't find dog information.` });
			});
		});

		context(`Given there is data in the tables`, () => {
			beforeEach("Insert data into tables", () => {
				return db
					.into("dogs")
					.insert(dogs)
					.then((res) => {
						return db.into("users").insert(testUsers);
					})
					.then((res) => {
						return db.into("foster").insert(testFoster);
					});
			});
			it(`responds with 200 with foster information`, () => {
				const dogTestId = 1;
				return supertest(app)
					.get(`/api/v1/foster/${dogTestId}`)
					.set("Authorization", helpers.makeAuthHeader(testUsers[0]))
					.expect(200);
			});
		});
	});
	describe("POST /foster", () => {
		context(`Given there is no data in the tables`, () => {
			beforeEach(`Seed users`, () => {
				helpers.seedUsers(db, testUsers);
			});

			it(`responds with 400 Can't find foster information`, () => {
				return supertest(app)
					.post("/api/v1/foster")
					.set("Authorization", helpers.makeAuthHeader(testUsers[0]))
					.field(encryptedFoster)
					.attach("contract", `test/ContractSample.pdf`)
					.expect(404, { error: `It doesn't look like dog exists.` });
			});
		});

		context(`Given there is data in the tables`, () => {
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

			it(`responds with 201 created `, () => {
				return supertest(app)
					.post("/api/v1/foster")
					.set("Authorization", helpers.makeAuthHeader(testUsers[0]))
					.field(encryptedFoster)
					.attach("contract", `test/ContractSample.pdf`)
					.expect(201, { message: "Foster completed." })
					.then((res) => {
						supertest(app)
							.get("/api/v1/foster/1")
							.set("Authorization", helpers.makeAuthHeader(testUsers[0]))
							.then((res) => console.log(res.body));
					});
			});
		});
	});

	describe("DELETE /foster/:dogId", () => {
		context("Given there is NO data in the tables", () => {
			beforeEach(`Seed users`, () => {
				helpers.seedUsers(db, testUsers);
			});

			it(`Responds with 400 Can't find dog`, () => {
				const dogIdTest = testFoster.dog_id;
				return supertest(app)
					.delete(`/api/v1/foster/${dogIdTest}`)
					.set("Authorization", helpers.makeAuthHeader(testUsers[0]))
					.expect(404, { error: `Can't find dog.` });
			});
		});
		context("Given there is data in the tables", () => {
			beforeEach("Insert data into tables", () => {
				return db
					.into("dogs")
					.insert(dogs)
					.then((res) => {
						return db.into("users").insert(testUsers);
					})
					.then((res) => {
						return db.into("foster").insert(testFoster);
					});
			});

			it(`Responds with 204 with successul deletion`, () => {
				const dogIdTest = testFoster.dog_id;
				const expectedFosters = fosterList.filter(
					(n) => n.dog_id !== dogIdTest
				);

				return supertest(app)
					.delete(`/api/v1/foster/${dogIdTest}`)
					.set("Authorization", helpers.makeAuthHeader(testUsers[0]))
					.expect(204)
					.then((res) => {
						supertest(app)
							.get(`/api/v1/foster/${dogIdTest}`)
							.set("Authorization", helpers.makeAuthHeader(testUsers[0]))
							.expect(expectedFosters);
					});
			});
		});
	});
});
