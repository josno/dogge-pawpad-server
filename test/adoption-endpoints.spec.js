const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");
const supertest = require("supertest");

describe("Adoption endpoints", () => {
	let db;

	const testUsers = helpers.makeUsersArray();
	const newAdoption = helpers.makeNewAdoption();

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

	describe("GET /adoption", () => {
		context(`Given there is no data in the tables`, () => {
			beforeEach(`Seed users`, () => {
				helpers.seedUsers(db, testUsers);
			});

			it(`responds with 200`, () => {
				return supertest(app)
					.get("/api/v1/adoption")
					.set("Authorization", helpers.makeAuthHeader(testUsers[0]))
					.expect(200, "hello");
			});
		});
	});

	describe.only("POST /adoption", () => {
		context(`Given there is no data in the tables`, () => {
			beforeEach(`Seed users`, () => {
				helpers.seedUsers(db, testUsers);
			});

			it(`responds with 404 Can't find dog`, () => {
				return supertest(app)
					.post("/api/v1/adoption")
					.set("Authorization", helpers.makeAuthHeader(testUsers[0]))
					.send(newAdoption)
					.expect(400, { error: `Can't add adoption details.` });
			});
		});
	});
});
