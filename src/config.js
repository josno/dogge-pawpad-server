module.exports = {
	PORT: process.env.PORT || 8000,
	NODE_ENV: process.env.NODE_ENV || "development",
	DATABASE_URL:
		process.env.DATABASE_URL || "postgres://pawpad_user@localhost:5432/pawpad",
	JWT_SECRET: process.env.JWT_SECRET || "change-this-secret",
	CLIENT_ORIGIN: "https://dogge.usepawpad.com",
	// CLIENT_ORIGIN: "http://localhost:3000",
	CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
	CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
	CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
	ENCRYPTION_KEY: process.env.SECRE_T_SCRAMBLE_PASSWORD,
};
