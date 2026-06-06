const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

const userSchema = new mongoose.Schema({
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: false },
	googleId: { type: String, required: false },
	avatar: { type: String, required: false },
	isVerified: { type: Boolean, default: false },
	verificationToken: { type: String, required: false },
	friends: [{ type: String }], // array of friend email addresses
	friendRequests: [{
		from: { type: String, required: true },   // email of requester
		fromName: { type: String, required: true }  // name of requester
	}],
	passwordResetToken: { type: String, required: false },
	passwordResetExpires: { type: Date, required: false },
});

userSchema.methods.generateAuthToken = function () {
	const token = jwt.sign(
        { _id: this._id, email: this.email, firstName: this.firstName, lastName: this.lastName }, 
        process.env.JWTPRIVATEKEY, 
        { expiresIn: "7d" }
    );
	return token;
};

const User = mongoose.model("user", userSchema);

const validate = (data) => {
	const schema = Joi.object({
		firstName: Joi.string().required().label("First Name"),
		lastName: Joi.string().required().label("Last Name"),
		email: Joi.string().email().required().label("Email"),
		password: passwordComplexity().required().label("Password"),
	});
	return schema.validate(data);
};

module.exports = { User, validate };
