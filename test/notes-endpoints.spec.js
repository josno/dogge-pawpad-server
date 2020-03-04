const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');
const supertest = require('supertest');

describe('Notes Endpoints', function() {
	let db;

	const dogs = helpers.makeDogsArray();
	const notes = helpers.makeNotesArray();
	const shots = helpers.makeShotsArray();
	const testUsers = helpers.makeUsersArray();
	const testUser = testUsers[0];

	before('make knex instance', () => {
		db = knex({
			client: 'pg',
			connection: process.env.TEST_DATABASE_URL
		});
		app.set('db', db);
	});

	after('disconnect from db', () => db.destroy());

	before('clear tables', () => helpers.clearTables(db));

	afterEach('clear tables', () => helpers.clearTables(db));

	describe(`POST /api/v1/notes`, () => {
		context(`Given there is data in the tables`, () => {
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

			const newNote = helpers.makeNewNote();

			const requiredFields = ['notes', 'type_of_note'];

			requiredFields.forEach(field => {
				const noteAttemptBody = {
					notes: newNote.notes,
					type_of_note: newNote.type_of_note
				};

				it(`responds with 400 required error when '${field}' is missing`, () => {
					delete noteAttemptBody[field]; //deletes the specified field first; then test

					return supertest(app)
						.post('/api/v1/notes')
						.set('Authorization', helpers.makeAuthHeader(testUser))
						.send(noteAttemptBody)
						.expect(400, {
							error: `Missing '${field}' in request body`
						});
				});
			});

			it(`Returns 201 created with new content`, () => {
				const newNote = helpers.makeNewNote();
				return supertest(app)
					.post(`/api/v1/notes`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.send(newNote)
					.expect(201);
			});
		});
	});

	describe(`GET /api/v1/notes/:noteId`, () => {
		context(`Given no notes in database`, () => {
			beforeEach('Insert Users', () => {
				helpers.seedUsers(db, testUsers);
			});

			it(`returns 200 with empty list`, () => {
				const testId = 49530;
				return supertest(app)
					.get(`/api/v1/notes/${testId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(200);
			});
		});

		context(`Given notes in database`, () => {
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

			it(`returns 200 and list of notes`, () => {
				const testId = 1;
				return supertest(app)
					.get(`/api/v1/notes/${testId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(200);
			});
		});
	});
});
