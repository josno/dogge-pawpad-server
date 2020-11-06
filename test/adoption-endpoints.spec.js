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
	const adoptions = helpers.makeAdoptionArray();

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

	describe("GET /adoption/:dogId", () => {
		context(`Given there is no data in the tables`, () => {
			beforeEach(`Seed users`, () => {
				helpers.seedUsers(db, testUsers);
			});

			it(`responds with 400 Can't find adoption information`, () => {
				const dogTestId = 0;
				return supertest(app)
					.get(`/api/v1/adoption/${dogTestId}`)
					.set("Authorization", helpers.makeAuthHeader(testUsers[0]))
					.expect(400, { error: `Can't find adoption information.` });
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
						return db.into("adoption").insert(adoptions);
					});
			});
			it(`responds with 200 with adoption information`, () => {
				const dogTestId = 1;
				const expectedAdoptionInfo = adoptions[0];
				expectedAdoptionInfo.id = 1;
				return supertest(app)
					.get(`/api/v1/adoption/${dogTestId}`)
					.set("Authorization", helpers.makeAuthHeader(testUsers[0]))
					.expect(200, expectedAdoptionInfo);
			});
		});
	});

	describe("POST /adoption", () => {
		context(`Given there is no data in the tables`, () => {
			beforeEach(`Seed users`, () => {
				helpers.seedUsers(db, testUsers);
			});
			//issues with HTTP headers
			it(`responds with 404 Can't find dog`, () => {
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

			it.only(`responds with 201 created `, () => {
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

	describe("DELETE /adoption/:dogId", () => {
		context("Given there is NO data in the tables", () => {
			beforeEach(`Seed users`, () => {
				helpers.seedUsers(db, testUsers);
			});

			it(`Responds with 400 Can't find dog`, () => {
				const dogIdTest = newAdoption.dog_id;
				return supertest(app)
					.delete(`/api/v1/adoption/${dogIdTest}`)
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
						return db.into("adoption").insert(adoptions);
					})
					.then((res) => console.log("done"));
			});

			it(`Responds with 204 with successul deletion`, () => {
				const dogIdTest = newAdoption.dog_id;
				const expectedAdoptions = adoptions.filter(
					(n) => n.dog_id !== dogIdTest
				);

				return supertest(app)
					.delete(`/api/v1/adoption/${dogIdTest}`)
					.set("Authorization", helpers.makeAuthHeader(testUsers[0]))
					.expect(204)
					.then((res) => {
						supertest(app)
							.get(`/api/v1/adoption/${dogIdTest}`)
							.set("Authorization", helpers.makeAuthHeader(testUsers[0]))
							.expect(expectedAdoptions);
					});
			});
		});
	});
});
