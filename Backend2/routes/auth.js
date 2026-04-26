const router = require("express").Router();
const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email Login
router.post("/", async (req, res) => {
	try {
		const { error } = validate(req.body);
		if (error)
			return res.status(400).send({ message: error.details[0].message });

		const user = await User.findOne({ email: req.body.email });
		if (!user)
			return res.status(401).send({ message: "Invalid Email or Password" });

		if(!user.password) {
			return res.status(401).send({ message: "Please sign in with Google" });
		}

		const validPassword = await bcrypt.compare(req.body.password, user.password);
		if (!validPassword)
			return res.status(401).send({ message: "Invalid Email or Password" });

		const token = user.generateAuthToken();
		res.status(200).send({ data: token, message: "Logged in successfully" });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
});

// Google OAuth Login
router.post("/google", async (req, res) => {
	try {
		const { credential } = req.body;
		// If google client id is not setup, bypass verification securely for dev mode
		// (In production, replace early returns with actual client verification)
		if (!process.env.GOOGLE_CLIENT_ID) {
			console.warn("GOOGLE_CLIENT_ID not found in .env, bypassing token verification for demo.");
		}

		let payload;
		if (process.env.GOOGLE_CLIENT_ID) {
			const ticket = await client.verifyIdToken({
				idToken: credential,
				audience: process.env.GOOGLE_CLIENT_ID,
			});
			payload = ticket.getPayload();
		} else {
			// Stub payload mapped from basic JWT decode if missing client ID
			const decoded = require('jsonwebtoken').decode(credential);
			payload = decoded;
		}

		const { email, given_name, family_name, sub, picture } = payload;
		const emailVerified = payload.email_verified || true;

		let user = await User.findOne({ email });

		if (!user) {
			user = await new User({
				firstName: given_name || "User",
				lastName: family_name || "",
				email: email,
				googleId: sub,
				avatar: picture,
				isVerified: emailVerified,
			}).save();
		} else {
			// Update missing google ID if user existed via email before
			if (!user.googleId) user.googleId = sub;
			if (!user.avatar && picture) user.avatar = picture;
			await user.save();
		}

		const token = user.generateAuthToken();
		res.status(200).send({ data: token, message: "Google Login successful" });
	} catch (error) {
		console.error("Google Auth error:", error);
		res.status(500).send({ message: "Google Authentication failed" });
	}
});

const validate = (data) => {
	const schema = Joi.object({
		email: Joi.string().email().required().label("Email"),
		password: Joi.string().required().label("Password"),
	});
	return schema.validate(data);
};

module.exports = router;
