import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// Password complexity regex: minimum 6 characters, at least one letter and one number
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

// Email verification regex
const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  const { name, email, password, role, company, avatar } = req.body;

  try {
    // 1. Input validations
    if (!name || !email || !password || !company) {
      res.status(400);
      throw new Error('Please fill in all required fields (name, email, password, company) 📝');
    }

    if (!EMAIL_REGEX.test(email)) {
      res.status(400);
      throw new Error('Please enter a valid email address ✉️');
    }

    if (!PASSWORD_REGEX.test(password)) {
      res.status(400);
      throw new Error('Password must be at least 6 characters long and contain both letters and numbers 🔒');
    }

    // 2. Check duplicate email
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email address 🚨');
    }

    // 3. Create User
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'employee',
      company,
      avatar: avatar || ''
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: 'Registration successful! 🎉',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company,
          avatar: user.avatar,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data provided');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // 1. Validation
    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password 📝');
    }

    // 2. Fetch user (select password to match)
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      // Update last login timestamp
      user.lastLogin = new Date();
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Login successful! Welcome back 🎉',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company,
          avatar: user.avatar,
          lastLogin: user.lastLogin,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password credentials ❌');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    // req.user is populated by protect middleware
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear token
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully! Discarding authorization token on client. 👋'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile details
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found 🚨');
    }

    // Update allowable fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.avatar) user.avatar = req.body.avatar;
    if (req.body.company) user.company = req.body.company;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile details updated successfully! 👤',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        company: updatedUser.company,
        avatar: updatedUser.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password with current validation
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error('Please fill in current and new password fields 🔑');
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      res.status(400);
      throw new Error('New password must be at least 6 characters long and contain both letters and numbers 🔒');
    }

    // Retrieve user and select password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password match
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(400);
      throw new Error('Current password credentials do not match ❌');
    }

    // Save new password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully! 🔐'
    });
  } catch (error) {
    next(error);
  }
};
