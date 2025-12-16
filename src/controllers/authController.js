const User = require('@models/User');
const Verification = require('@models/verification');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const response = require("../responses");
const mailservice = require('@services/mailservice');
const userHelper = require('../helper/user');
const moment = require('moment');
const Device = require('@models/Device');

module.exports = {
  register: async (req, res) => {
    try {
      const { name, email, password, phone, role } = req.body;

      if (password.length < 6) {
        return res
          .status(400)
          .json({ message: 'Password must be at least 8 characters long' });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      let newUser = new User({
        name,
        email,
        password: hashedPassword,
      });

      if (role) {
        newUser.role = role;
      }

      if (phone) {
        newUser.phone = phone;
      }

      await newUser.save();

      const userResponse = await User.findById(newUser._id).select('-password');
      return response.ok(res, {
        message: "User registered successfully.",
        data: userResponse,
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return response.badReq(res, { message: 'Email and password are required' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return response.unAuthorize(res, { message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return response.unAuthorize(res, { message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user._id, email: user.email,role:user.role }, process.env.JWT_SECRET);

      const newData = {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          image:user.image
        },
      };
       await Device.updateOne(
        { device_token: req.body.device_token },
        { $set: { player_id: req.body.player_id, user: user._id } },
        { upsert: true },
      );
      return response.ok(res, newData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  sendOTP: async (req, res) => {
    try {
      const email = req.body.email;
      const user = await User.findOne({ email });

      if (!user) {
        return response.badReq(res, { message: "Email does exist." });
      }

      // let ran_otp = Math.floor(1000 + Math.random() * 9000);
      let ran_otp = '0000';
      // await mailservice.sendOTPmail({
      //   code: ran_otp,
      //   email: email,
      // });

      let ver = new Verification({
        user: user._id,
        otp: ran_otp,
        expiration_at: userHelper.getDatewithAddedMinutes(5),
      });
      await ver.save();
      // }
      let token = await userHelper.encode(ver._id);

      return response.ok(res, { message: "OTP sent.", token });
    } catch (error) {
      return response.error(res, error);
    }
  },

  verifyOTP: async (req, res) => {
    try {
      const otp = req.body.otp;
      const token = req.body.token;
      if (!(otp && token)) {
        return response.badReq(res, { message: "otp and token required." });
      }
      let verId = await userHelper.decode(token);
      let ver = await Verification.findById(verId);
      if (
        otp == ver.otp &&
        !ver.verified &&
        new Date().getTime() < new Date(ver.expiration_at).getTime()
      ) {
        let token = await userHelper.encode(
          ver._id + ":" + userHelper.getDatewithAddedMinutes(5).getTime()
        );
        ver.verified = true;
        await ver.save();
        return response.ok(res, { message: "OTP verified", token });
      } else {
        return response.notFound(res, { message: "Invalid OTP" });
      }
    } catch (error) {
      return response.error(res, error);
    }
  },

  changePassword: async (req, res) => {
    try {
      const token = req.body.token;
      const password = req.body.password;
      const data = await userHelper.decode(token);
      const [verID, date] = data.split(":");
      if (new Date().getTime() > new Date(date).getTime()) {
        return response.forbidden(res, { message: "Session expired." });
      }
      let otp = await Verification.findById(verID);
      if (!otp.verified) {
        return response.forbidden(res, { message: "unAuthorize" });
      }
      let user = await User.findById(otp.user);
      if (!user) {
        return response.forbidden(res, { message: "unAuthorize" });
      }
      await Verification.findByIdAndDelete(verID);
      user.password = user.encryptPassword(password);
      await user.save();
      // mailservice.passwordChange({ email: user.email });
      return response.ok(res, { message: "Password changed! Login now." });
    } catch (error) {
      return response.error(res, error);
    }
  },

  myProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id, '-password');
      return response.ok(res, user);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateprofile: async (req, res) => {
    try {
      const payload = req.body;
      if (req.file && req.file.location) {
        payload.image = req.file.location;
      }
      console.log('payload', req.user.id);
      const user = await User.findByIdAndUpdate(req.user.id, payload, {
        new: true,
        upsert: true,
      });
      return response.ok(res, { user, message: 'Profile Updated Succesfully' });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getAllUser: async (req, res) => {
    console.log('AAAAAAA', new Date(req.query.date))
    try {
      let cond = {
        role: 'user',
      };

      let startDate
      let endDate
      if (req.query.date) {
        startDate = new Date(req.query.date);
        console.log('SDDDD', startDate)
        endDate = new Date(new Date(req.query.date).setDate(startDate.getDate() + 1));
        console.log('EDDDD', endDate)
        cond.createdAt = { $gte: startDate, $lte: endDate };
      }

      if (req.query.key) {
        cond['$or'] = [
          { name: { $regex: req.query.key, $options: "i" } },
        ]
      }

      if (req.query.email) {
        cond['$or'] = [
          { email: { $regex: req.query.email, $options: "i" } },
        ]
      }

      if (req.query.key && req.query.date) {
        cond['$or'] = [
          { name: { $regex: req.query.key, $options: "i" } },
          { createdAt: { $gte: startDate, $lte: endDate } },
        ]
      }

      if (req.query.email && req.query.date) {
        cond['$or'] = [
          { email: { $regex: req.query.email, $options: "i" } },
          { createdAt: { $gte: startDate, $lte: endDate } },
        ]
      }

      if (req.query.key && req.query.emai && req.query.date) {
        cond['$or'] = [
          { name: { $regex: req.query.key, $options: "i" } },
          { email: { $regex: req.query.email, $options: "i" } },
          { createdAt: { $gte: startDate, $lte: endDate } },
        ]
      }

      const u = await User.find(cond, '-password').sort({createdAt: -1,});
      return response.ok(res, u);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getAllAffiliates: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const u = await User.find({role: 'user'}, '-password').sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, u);
    } catch (error) {
      return response.error(res, error);
    }
  },

};
