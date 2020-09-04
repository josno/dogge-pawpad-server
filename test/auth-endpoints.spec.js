const knex = require("knex");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe("Auth Endpoints", function () {
	let db;

	const testUsers = helpers.makeUsersArray();
	const testUser = testUsers[0];

	const testShelter = helpers.makeShelter();

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
	// db, shelter, dogs, notes, shots, users
	beforeEach("insert users and shelter", () => {
		return db
			.into("shelter")
			.insert(testShelter)
			.then((res) => {
				return helpers.seedUsers(db, testUsers);
			});
	});

	describe.only(`POST /api/auth/login`, () => {
		const requiredFields = ["user_name", "password"];

		requiredFields.forEach((field) => {
			const loginAttemptBody = {
				user_name: testUser.user_name,
				password: testUser.password,
			};

			it(`responds with 400 required error when '${field}' is missing`, () => {
				delete loginAttemptBody[field]; //deletes the specified field first; then test

				return supertest(app)
					.post("/api/v1/auth/login")
					.send(loginAttemptBody)
					.expect(400, {
						error: `Missing '${field}' in request body`,
					});
			});
		});

		it(`responds 400 'invalid user_name or password' when bad user_name`, () => {
			const userInvalidUser = {
				user_name: "user-not",
				password: testUser.password,
			};
			return supertest(app)
				.post("/api/v1/auth/login")
				.send(userInvalidUser)
				.expect(400, { error: `Incorrect username or password` });
		});

		it(`responds 400 'invalid user_name or password' when bad password`, () => {
			const userInvalidPass = {
				user_name: testUser.user_name,
				password: "incorrect",
			};
			return supertest(app)
				.post("/api/v1/auth/login")
				.send(userInvalidPass)
				.expect(400, { error: `Incorrect username or password` });
		});

		it(`responds 200 and JWT auth token using secret when valid credentials`, () => {
			const userValidCreds = {
				user_name: testUser.user_name,
				password: testUser.password,
				shelter_username: testShelter.shelter_username,
			};

			const expectedToken = jwt.sign(
				{ user_id: testUser.id },
				process.env.JWT_SECRET,
				{
					subject: testUser.user_name,
					algorithm: "HS256",
				}
			);

			return supertest(app)
				.post("/api/v1/auth/login")
				.send(userValidCreds)
				.expect(200, { authToken: expectedToken, shelterId: 1 });
		});
	});
});
