const userModel = require('../models/user.model');
const userService = require('../services/user.service');
const { validationResult } = require('express-validator')


module.exports.registerUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    console.log(req.body);

    try {
        const { fullname, email, password } = req.body;
        
        // Ensure fullname is handled correctly
        let firstname = "";
        let lastname = "";
        if (typeof fullname === "string") {
            [firstname, lastname] = fullname.split(" ");
            lastname = lastname || ""; // Avoid undefined issues
        } else {
            firstname = fullname.firstname;
            lastname = fullname.lastname;
        }

        const hashPassword = await userModel.hashPassword(password);
        console.log(hashPassword);

        const user = await userService.createUser({
            firstname,
            lastname,
            email,
            password: hashPassword
        });

        if (!user) {
            return res.status(500).json({ error: "User creation failed" });
        }

        console.log(user);
        const token = await user.generateAuthToken();
        console.log(token);

        res.status(201).json({ token, user });

    } catch (error) {
        console.error("Error in user registration:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


module.exports.loginUser = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array() });
    }

    const { email, password } = req.body;
   const user  = await userModel.findOne({ email }).select('+password');

   if(!user) {
       return res.status(401).json({ message: 'Invalid email or password' });
   }
   const isMatch = await user.comparePassword(password);

   if(!isMatch) {
       return res.status(401).json({ message: 'Invalid email or password' });
   }
   const token = user.generateAuthToken();

    res.status(200).json({ token, user });
}