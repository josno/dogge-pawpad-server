const knex = require("knex");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe.only("Shelter Endpoints", function () {
	let db;

	const testShelter = helpers.makeShelter;
	// const testUser = testUsers[1];

	before("make knex instance", () => {
		db = knex({
			client: "pg",
			connection: process.env.TEST_DATABASE_URL,
		});
		app.set("db", db);
	});

	after("disconnect from db", () => db.destroy());

	before("cleanup", () => helpers.clearTables(db));

	afterEach("cleanup", () => helpers.clearTables(db));

	describe("POST /api/v1/shelter", () => {
		context("Validate shelter that doesn't exist in the database", () => {
			const requiredFields = [
				"shelter_name",
				"shelter_username",
				"shelter_country",
				"shelter_address",
				"shelter_phone",
				"shelter_email",
			];

			requiredFields.forEach((field) => {
				const registerAttemptBody = {
					shelter_name: "Demo",
					shelter_username: "demo",
					shelter_country: "United States",
					shelter_address: "Test 1 Way",
					shelter_phone: "123-2345",
					shelter_email: "test@testemail.com",
				};

				it(`responds with 400 required error when '${field}' is missing`, () => {
					delete registerAttemptBody[field];

					return supertest(app)
						.post("/api/v1/shelter")
						.send(registerAttemptBody)
						.expect(400, {
							error: `Missing '${field}' in request body`,
						});
				});
			});
		});
	});
});
