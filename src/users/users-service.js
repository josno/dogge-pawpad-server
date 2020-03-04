const xss = require('xss');
const bcrypt = require('bcryptjs');

const UsersService = {
	insertNewUser(db, newUser) {
		return db
			.insert(newUser)
			.into('users')
			.returning('*')
			.then(([user]) => user);
	},
	hasUserWithUserName(db, user_name) {
		return db('users')
			.where({ user_name })
			.first()
			.then(user => !!user);
	},
	validatePassword(password) {
		if (password.length < 8) {
			return 'Password should be longer.';
		}
		if (password.length > 72) {
			return 'Password must be less than 72 characters';
		}
		const hasNumbers = password.match(/[0-9]/g);

		if (!hasNumbers || hasNumbers === null) {
			return 'Password has to include at least a number.';
		}
	},
	validateUsername(username) {
		const invalidUsername = username.includes(' ');

		if (invalidUsername) {
			return `Username cannot have spaces.`;
		}
	},
	validateFirstName(firstName) {
		const invalidfirstName = firstName.includes(' ');

		if (invalidfirstName) {
			return `First name cannot have spaces.`;
		}
	},
	validateLastName(lastName) {
		const invalidLastName = lastName.includes(' ');

		if (invalidLastName) {
			return `Last name cannot have spaces.`;
		}
	},
	serializeUser(user) {
		return {
			id: user.id,
			first_name: xss(user.first_name),
			last_name: xss(user.last_name),
			user_name: xss(user.user_name),
			date_created: new Date(user.date_created)
		};
	},
	hashPassword(password) {
		return bcrypt.hash(password, 12);
	}
};

module.exports = UsersService;
