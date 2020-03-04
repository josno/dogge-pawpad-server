const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Notes Protected Endpoints', function() {
	let db;

	const dogs = helpers.makeDogsArray();
	const testUsers = helpers.makeUsersArray();
	const notes = helpers.makeNotesArray();
	const shots = helpers.makeShotsArray();

	before('make knex instance', () => {
		db = knex({
			client: 'pg',
			connection: process.env.TEST_DATABASE_URL
		});
		app.set('db', db);
	});

	after('disconnect from db', () => db.destroy());

	before('cleanup', () => helpers.clearTables(db));

	afterEach('cleanup', () => helpers.clearTables(db));

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

	describe(`POST '/api/v1/notes`, () => {
		it(`responds 401 'Missing bearer token' when no bearer token`, () => {
			return supertest(app)
				.post('/api/v1/notes')
				.expect(401, { error: `Missing bearer token` });
		});

		it(`responds with 401 'Unauthorized request' when user doesn't exist`, () => {
			const invalidUser = { user_name: 'nonexistent', id: 4 };
			return supertest(app)
				.post('/api/v1/notes')
				.set('Authorization', helpers.makeAuthHeader(invalidUser))
				.expect(401, { error: `Unauthorized request` });
		});

		it(`responds with 401 'Unauthorized request' when JWT is invalid`, () => {
			const validUser = testUsers[0];
			const invalidSecret = 'invalid-secret';
			return supertest(app)
				.post('/api/v1/notes')
				.set(
					'Authorization',
					helpers.makeAuthHeader(validUser, invalidSecret)
				)
				.expect(401, { error: `Unauthorized request` });
		});
	});

	describe(`GET '/api/v1/notes/:dogId`, () => {
		it(`responds 401 'Missing bearer token' when no bearer token`, () => {
			return supertest(app)
				.get('/api/v1/notes/2')
				.expect(401, { error: `Missing bearer token` });
		});

		it(`responds with 401 'Unauthorized request' when user doesn't exist`, () => {
			const invalidUser = { user_name: 'nonexistent', id: 4 };
			return supertest(app)
				.get('/api/v1/notes/2')
				.set('Authorization', helpers.makeAuthHeader(invalidUser))
				.expect(401, { error: `Unauthorized request` });
		});

		it(`responds with 401 'Unauthorized request' when JWT is invalid`, () => {
			const validUser = testUsers[0];
			const invalidSecret = 'invalid-secret';
			return supertest(app)
				.get('/api/v1/notes/1')
				.set(
					'Authorization',
					helpers.makeAuthHeader(validUser, invalidSecret)
				)
				.expect(401, { error: `Unauthorized request` });
		});
	});
});
