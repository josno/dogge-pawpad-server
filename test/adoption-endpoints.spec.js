const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");
const supertest = require("supertest");

describe("Adoption endpoints", () => {
	let db;

	const testUsers = helpers.makeUsersArray();
	const dogs = helpers.makeDogsArray();
	const shots = helpers.makeShotsArray();
	const notes = helpers.makeNotesArray();
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
			//issues with HTTP headers
			it(`responds with 404 Can't add adoption details`, () => {
				return supertest(app)
					.post("/api/v1/adoption")
					.set("Authorization", helpers.makeAuthHeader(testUsers[0]))
					.send(newAdoption)
					.expect(404, { error: `Can't find dog.` });
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
					.post("/api/v1/adoption")
					.set("Authorization", helpers.makeAuthHeader(testUsers[0]))
					.send(newAdoption)
					.expect(201)
					.then((res) => {
						expect(res.body).to.have.property("id");
						expect(res.body.dog_id).to.eql(newAdoption.dog_id);
						expect(res.body.adopter_name).to.eql(newAdoption.adopter_name);
						expect(res.body.adopter_date).to.eql(newAdoption.adopter_date);
						expect(res.body.adopter_email).to.eql(newAdoption.adopter_email);
						expect(res.body.adopter_phone).to.eql(newAdoption.adopter_phone);
						expect(res.body.adopter_address).to.eql(
							newAdoption.adopter_address
						);
						expect(res.headers.location).to.eql(
							`/api/v1/adoption/${res.body.id}`
						);
					});
			});
		});
	});
});
