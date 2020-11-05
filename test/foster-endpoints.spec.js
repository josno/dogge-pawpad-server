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

	describe.only("GET /foster/:dogId", () => {
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

		// context(`Given there is data in the tables`, () => {
		// 	beforeEach("Insert data into tables", () => {
		// 		return db
		// 			.into("dogs")
		// 			.insert(dogs)
		// 			.then((res) => {
		// 				return db.into("users").insert(testUsers);
		// 			})
		// 			.then((res) => {
		// 				return db.into("foster").insert(foster);
		// 			});
		// 	});
		// 	it(`responds with 200 with adoption information`, () => {
		// 		const dogTestId = 1;
		// 		const expectedAdoptionInfo = adoptions[0];
		// 		expectedAdoptionInfo.id = 1;
		// 		return supertest(app)
		// 			.get(`/api/v1/adoption/${dogTestId}`)
		// 			.set("Authorization", helpers.makeAuthHeader(testUsers[0]))
		// 			.expect(200, expectedAdoptionInfo);
		// 	});
		// });
	});
});
