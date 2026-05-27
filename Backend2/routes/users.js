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

// Send Friend Request
router.post("/friends/request", authenticateToken, async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) return res.status(400).send({ message: "Email is required." });

		const me = await User.findById(req.user._id);
		if (!me) return res.status(404).send({ message: "User not found" });

		if (me.email === email) return res.status(400).send({ message: "You cannot add yourself." });

		const target = await User.findOne({ email });
		if (!target) return res.status(404).send({ message: "No user found with that email." });

		// Check if already friends
		if (me.friends && me.friends.includes(email)) {
			return res.status(400).send({ message: "Already friends!" });
		}

		// Check if request already sent
		const alreadySent = target.friendRequests && target.friendRequests.some(r => r.from === me.email);
		if (alreadySent) {
			return res.status(400).send({ message: "Friend request already sent." });
		}

		// Check if they already sent us a request (auto-accept)
		const theyRequestedUs = me.friendRequests && me.friendRequests.some(r => r.from === email);
		if (theyRequestedUs) {
			// Auto-accept
			me.friendRequests = me.friendRequests.filter(r => r.from !== email);
			if (!me.friends) me.friends = [];
			if (!target.friends) target.friends = [];
			me.friends.push(email);
			target.friends.push(me.email);
			await me.save();
			await target.save();
			return res.status(200).send({ message: `You and ${target.firstName} are now friends!` });
		}

		if (!target.friendRequests) target.friendRequests = [];
		target.friendRequests.push({ from: me.email, fromName: me.firstName + " " + me.lastName });
		await target.save();

		res.status(200).send({ message: `Friend request sent to ${target.firstName}!` });
	} catch (error) {
		console.error(error);
		res.status(500).send({ message: "Internal Server Error" });
	}
});

// Accept Friend Request
router.post("/friends/accept", authenticateToken, async (req, res) => {
	try {
		const { email } = req.body;
		const me = await User.findById(req.user._id);
		if (!me) return res.status(404).send({ message: "User not found" });

		const requestIndex = me.friendRequests ? me.friendRequests.findIndex(r => r.from === email) : -1;
		if (requestIndex === -1) return res.status(404).send({ message: "No such friend request." });

		const target = await User.findOne({ email });
		if (!target) return res.status(404).send({ message: "User not found." });

		// Remove request and add each other as friends
		me.friendRequests.splice(requestIndex, 1);
		if (!me.friends) me.friends = [];
		if (!target.friends) target.friends = [];
		if (!me.friends.includes(email)) me.friends.push(email);
		if (!target.friends.includes(me.email)) target.friends.push(me.email);

		await me.save();
		await target.save();

		res.status(200).send({ message: `You are now friends with ${target.firstName}!` });
	} catch (error) {
		console.error(error);
		res.status(500).send({ message: "Internal Server Error" });
	}
});

// Decline Friend Request
router.post("/friends/decline", authenticateToken, async (req, res) => {
	try {
		const { email } = req.body;
		const me = await User.findById(req.user._id);
		if (!me) return res.status(404).send({ message: "User not found" });

		me.friendRequests = (me.friendRequests || []).filter(r => r.from !== email);
		await me.save();

		res.status(200).send({ message: "Friend request declined." });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
});

// Get Friends List
router.get("/friends", authenticateToken, async (req, res) => {
	try {
		const me = await User.findById(req.user._id);
		if (!me) return res.status(404).send({ message: "User not found" });

		const friendEmails = me.friends || [];
		const friends = await User.find({ email: { $in: friendEmails } }).select("firstName lastName email avatar");
		
		const data = friends.map(f => ({
			email: f.email,
			name: f.firstName + " " + f.lastName
		}));

		res.status(200).send({ data });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
});

module.exports = router;
