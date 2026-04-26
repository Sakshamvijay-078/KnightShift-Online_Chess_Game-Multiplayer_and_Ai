const router = require("express").Router();
const { User, validate } = require("../models/user");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// JWT verification middleware
const authenticateToken = (req, res, next) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];
	if (token == null) return res.status(401).send({ message: "No token provided" });
	jwt.verify(token, process.env.JWTPRIVATEKEY, (err, user) => {
		if (err) return res.status(403).send({ message: "Invalid or expired token" });
		req.user = user;
		next();
	});
};

// Register
router.post("/", async (req, res) => {
	try {
		const { error } = validate(req.body);
		if (error) return res.status(400).send({ message: error.details[0].message });

		const userCheck = await User.findOne({ email: req.body.email });
		if (userCheck)
			return res.status(409).send({ message: "User with given email already exists!" });

		const salt = await bcrypt.genSalt(Number(process.env.SALT));
		const hashPassword = await bcrypt.hash(req.body.password, salt);
		
		const verificationToken = crypto.randomBytes(32).toString('hex');

		const newUser = await new User({ 
			...req.body, 
			password: hashPassword,
			verificationToken 
		}).save();
		
		// Fix: generate token on the explicitly instantiated and saved newUser document
		const token = newUser.generateAuthToken();
		
		return res.status(201).send({ data: token, message: "User created successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).send({ message: "Internal Server Error" });
	}
});

// Get User Profile
router.get("/profile", authenticateToken, async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select("-password -__v");
		if (!user) return res.status(404).send({ message: "User not found" });
		res.status(200).send({ data: user });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
});

// Update Profile
router.put("/profile", authenticateToken, async (req, res) => {
	try {
		const { firstName, lastName, photoUrl } = req.body;
		const user = await User.findById(req.user._id);
		if (!user) return res.status(404).send({ message: "User not found" });

		if (firstName) user.firstName = firstName;
		if (lastName) user.lastName = lastName;
		if (photoUrl) user.avatar = photoUrl;

		await user.save();
		res.status(200).send({ message: "Profile updated successfully", data: user });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
});

module.exports = router;
