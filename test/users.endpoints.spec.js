const knex = require('knex');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Users Endpoints', function() {
	let db;

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

	before('cleanup', () => helpers.clearTables(db));

	afterEach('cleanup', () => helpers.clearTables(db));

	describe(`POST /api/v1/users`, () => {
		context(`User Validation`, () => {
			beforeEach('insert users', () => helpers.seedUsers(db, testUsers));

			const requiredFields = [
				'user_name',
				'password',
				'first_name',
				'last_name'
			];

			requiredFields.forEach(field => {
				const registerAttemptBody = {
					user_name: 'test user_name',
					password: 'test password',
					first_name: 'first',
					last_name: 'last'
				};

				it(`responds with 400 required error when '${field}' is missing`, () => {
					delete registerAttemptBody[field];

					return supertest(app)
						.post('/api/v1/users')
						.send(registerAttemptBody)
						.expect(400, {
							error: `Missing '${field}' in request body`
						});
				});
			});

			it(`responds 400 'Password should be longer' when password is short`, () => {
				const userShortPassword = {
					user_name: 'test',
					password: '1234567',
					first_name: 'first',
					last_name: 'last'
				};
				return supertest(app)
					.post('/api/v1/users')
					.send(userShortPassword)
					.expect(400, {
						error: `Password should be longer.`
					});
			});

			it(`responds 400 'Password must be less than 72 characters' when long password`, () => {
				const userLongPass = {
					user_name: 'test',
					password: '*'.repeat(73),
					first_name: 'first',
					last_name: 'last'
				};

				return supertest(app)
					.post('/api/v1/users')
					.send(userLongPass)
					.expect(400, {
						error: `Password must be less than 72 characters`
					});
			});

			it(`responds 400 'Username is already taken', when user_name is duplicated`, () => {
				const duplicatedUser = {
					user_name: testUser.user_name,
					password: 'blahblah1!',
					first_name: 'first',
					last_name: 'last'
				};

				return supertest(app)
					.post('/api/v1/users')
					.send(duplicatedUser)
					.expect(400, { error: 'Username is already taken.' });
			});

			it(`respond 400 'Username cannot have spaces' when username is formatted incorrectly`, () => {
				const badUsername = {
					user_name: 'testuser space',
					password: 'blahblah1!',
					first_name: 'first',
					last_name: 'last'
				};

				return supertest(app)
					.post('/api/v1/users')
					.send(badUsername)
					.expect(400, { error: 'Username cannot have spaces.' });
			});

			it(`respond 400 'First name cannot have spaces' when username is formatted incorrectly`, () => {
				const badUsername = {
					user_name: 'testuser',
					password: 'blahblah1!',
					first_name: 'f irst',
					last_name: 'last'
				};

				return supertest(app)
					.post('/api/v1/users')
					.send(badUsername)
					.expect(400, { error: 'First name cannot have spaces.' });
			});

			it(`respond 400 'Last name cannot have spaces' when username is formatted incorrectly`, () => {
				const badUsername = {
					user_name: 'testuser',
					password: 'blahblah1!',
					first_name: 'first',
					last_name: 'la st'
				};

				return supertest(app)
					.post('/api/v1/users')
					.send(badUsername)
					.expect(400, { error: 'Last name cannot have spaces.' });
			});
		});

		context('Given an xss attack', () => {
			it('removes xss from the response body', () => {
				const maliciousUser = {
					user_name: '<script>badusername</script>',
					first_name: '<script>first</script>',
					last_name: '<script>last</script>',
					password: '<script>!2password</script>'
				};

				return supertest(app)
					.post('/api/v1/users')
					.send(maliciousUser)
					.expect(res => {
						expect(res.body.user.user_name).to.eql(
							'&lt;script&gt;badusername&lt;/script&gt;'
						);
						expect(res.body.user.first_name).to.eql(
							'&lt;script&gt;first&lt;/script&gt;'
						);
						expect(res.body.user.last_name).to.eql(
							'&lt;script&gt;last&lt;/script&gt;'
						);
					});
			});
		});

		context(`Inserts new user credentials and inserts to database`, () => {
			it(`responds 201, serialized user, storing bcryped password`, () => {
				const newUser = {
					user_name: 'testuser_name',
					password: '11AAaa!!',
					first_name: 'first',
					last_name: 'last'
				};

				return supertest(app)
					.post('/api/v1/users')
					.send(newUser)
					.expect(201)
					.expect(res => {
						expect(res.body.user.user_name).to.eql(
							newUser.user_name
						);
						expect(res.body.user.first_name).to.eql(
							newUser.first_name
						);
						expect(res.body.user.last_name).to.eql(
							newUser.last_name
						);
						expect(res.body).to.not.have.property('password');
						const expectedDate = new Date().toLocaleString('en', {
							timeZone: 'UTC'
						});
						const actualDate = new Date(
							res.body.user.date_created
						).toLocaleString();
						expect(actualDate).to.eql(expectedDate);
					})
					.expect(res =>
						db
							.from('users')
							.select('*')
							.where({ id: res.body.user.id })
							.first() /*return the first row*/
							.then(row => {
								/*'row' is returned entry*/
								expect(row.user_name).to.eql(newUser.user_name);
								expect(row.first_name).to.eql(
									newUser.first_name
								);
								expect(row.last_name).to.eql(newUser.last_name);
								expect(row.date_modified).to.eql(null);
								const expectedDate = new Date().toLocaleString(
									'en',
									{ timeZone: 'UTC' }
								);
								const actualDate = new Date(
									row.date_created
								).toLocaleString();
								expect(actualDate).to.eql(expectedDate);

								return bcrypt.compare(
									newUser.password,
									row.password
								);
							})
							.then(compareMatch => {
								expect(compareMatch).to.be.true;
							})
					);
			});
		});
	});
});
