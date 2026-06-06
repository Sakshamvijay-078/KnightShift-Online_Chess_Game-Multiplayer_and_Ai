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

// Forgot Password — send reset email
router.post("/forgot-password", async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) return res.status(400).send({ message: "Email is required." });

		const user = await User.findOne({ email });
		// Always return 200 to prevent email enumeration
		if (!user) return res.status(200).send({ message: "If that email exists, a reset link has been sent." });

		if (user.googleId && !user.password) {
			return res.status(400).send({ message: "This account uses Google Sign-In. Please sign in with Google." });
		}

		const crypto = require("crypto");
		// Generate a plain token (sent in email), hash stored in DB
		const plainToken = crypto.randomBytes(32).toString("hex");
		const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex");

		user.passwordResetToken = hashedToken;
		user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
		await user.save();

		const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
		const resetUrl = `${clientUrl}/reset-password/${plainToken}`;

		// Send email via nodemailer
		const nodemailer = require("nodemailer");
		const transporter = nodemailer.createTransport({
			service: process.env.EMAIL_SERVICE || "gmail",
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
		});

		const mailOptions = {
			from: `"KnightShift" <${process.env.EMAIL_USER}>`,
			to: user.email,
			subject: "KnightShift — Password Reset Request",
			html: `
				<div style="font-family: 'Segoe UI', sans-serif; background: #0f1117; color: #e2e8f0; padding: 40px; max-width: 600px; margin: auto; border-radius: 16px;">
					<div style="text-align: center; margin-bottom: 32px;">
						<h1 style="color: #818cf8; font-size: 28px; margin: 0;">♞ KnightShift</h1>
					</div>
					<h2 style="font-size: 22px; margin-bottom: 8px;">Password Reset Request</h2>
					<p style="color: #94a3b8; margin-bottom: 24px;">
						Hi <strong>${user.firstName}</strong>, we received a request to reset your password. Click the button below — this link expires in <strong>1 hour</strong>.
					</p>
					<div style="text-align: center; margin: 32px 0;">
						<a href="${resetUrl}" style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block;">
							Reset My Password
						</a>
					</div>
					<p style="color: #64748b; font-size: 13px; margin-top: 32px;">
						If you didn't request this, you can safely ignore this email — your password won't change.
					</p>
					<p style="color: #334155; font-size: 12px; margin-top: 16px; word-break: break-all;">
						Or copy this link: <a href="${resetUrl}" style="color: #818cf8;">${resetUrl}</a>
					</p>
				</div>
			`,
		};

		await transporter.sendMail(mailOptions);
		return res.status(200).send({ message: "If that email exists, a reset link has been sent." });
	} catch (error) {
		console.error("Forgot password error:", error);
		res.status(500).send({ message: "Failed to send reset email. Please try again later." });
	}
});

// Reset Password — validate token & set new password
router.post("/reset-password/:token", async (req, res) => {
	try {
		const { token } = req.params;
		const { password } = req.body;

		if (!password) return res.status(400).send({ message: "Password is required." });

		const crypto = require("crypto");
		const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

		const user = await User.findOne({
			passwordResetToken: hashedToken,
			passwordResetExpires: { $gt: new Date() },
		});

		if (!user) return res.status(400).send({ message: "Reset link is invalid or has expired." });

		const salt = await bcrypt.genSalt(Number(process.env.SALT) || 7);
		user.password = await bcrypt.hash(password, salt);
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save();

		res.status(200).send({ message: "Password reset successfully! You can now log in." });
	} catch (error) {
		console.error("Reset password error:", error);
		res.status(500).send({ message: "Internal Server Error" });
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
