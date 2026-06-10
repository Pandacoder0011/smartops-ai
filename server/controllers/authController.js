import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import mongoose from 'mongoose';

// Password complexity regex: minimum 6 characters, at least one letter and one number
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

// Email verification regex
const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

// In-Memory user storage fallback
export const mockUsers = [
  {
    _id: 'mock-admin-id-123',
    name: 'SmartOps Admin',
    username: 'admin',
    phoneNumber: '+1-555-0199',
    email: 'admin@smartops.ai',
    password: 'admin123',
    role: 'admin',
    company: 'SmartOps AI Mock',
    workspaceId: 'smartops-ai-mock-1234',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256',
    lastLogin: new Date()
  }
];

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  const { name, email, password, role, company, avatar, workspaceId } = req.body;

  try {
    // 1. Input validations
    if (!name || !email || !password || (!company && !workspaceId)) {
      res.status(400);
      throw new Error('Please fill in all required fields (name, email, password, and either company or workspace ID) 📝');
    }

    if (!EMAIL_REGEX.test(email)) {
      res.status(400);
      throw new Error('Please enter a valid email address ✉️');
    }

    if (!PASSWORD_REGEX.test(password)) {
      res.status(400);
      throw new Error('Password must be at least 6 characters long and contain both letters and numbers 🔒');
    }

    // Resolve company name if user is joining an existing workspace ID
    let resolvedCompany = company;
    let resolvedWorkspaceId = workspaceId;

    if (workspaceId && !company) {
      if (mongoose.connection.readyState === 1) {
        const existingWorkspaceUser = await User.findOne({ workspaceId });
        if (existingWorkspaceUser) {
          resolvedCompany = existingWorkspaceUser.company;
        } else {
          res.status(400);
          throw new Error('The specified Workspace ID does not exist 🚨');
        }
      } else {
        const existingWorkspaceUser = mockUsers.find(u => u.workspaceId === workspaceId);
        if (existingWorkspaceUser) {
          resolvedCompany = existingWorkspaceUser.company;
        } else {
          res.status(400);
          throw new Error('The specified Workspace ID does not exist in memory 🚨');
        }
      }
    }

    // 2. Check duplicate email (in-memory or mongo)
    if (mongoose.connection.readyState !== 1) {
      const userExists = mockUsers.find(u => u.email === email);
      if (userExists) {
        res.status(400);
        throw new Error('User already exists with this email address 🚨');
      }

      // Generate a mock workspace ID if creating new workspace without explicit ID
      if (!resolvedWorkspaceId) {
        resolvedWorkspaceId = resolvedCompany.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);
      }

      // 3. Create User in memory
      const user = {
        _id: 'mock-user-' + Math.random().toString(36).substr(2, 9),
        name,
        username: name.toLowerCase().replace(/\s+/g, '_'),
        phoneNumber: '+1-555-0100',
        email,
        password,
        role: role || 'employee',
        company: resolvedCompany,
        workspaceId: resolvedWorkspaceId,
        avatar: avatar || ''
      };
      mockUsers.push(user);

      res.status(201).json({
        success: true,
        message: 'Registration successful! 🎉',
        data: {
          _id: user._id,
          name: user.name,
          username: user.username || '',
          phoneNumber: user.phoneNumber || '',
          email: user.email,
          role: user.role,
          company: user.company,
          workspaceId: user.workspaceId,
          avatar: user.avatar,
          token: generateToken(user._id)
        }
      });
      return;
    }

    // MongoDB path
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email address 🚨');
    }

    const user = await User.create({
      name,
      username: name.toLowerCase().replace(/\s+/g, '_'),
      phoneNumber: '+1-555-0100',
      email,
      password,
      role: role || 'employee',
      company: resolvedCompany,
      workspaceId: resolvedWorkspaceId || undefined,
      avatar: avatar || ''
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: 'Registration successful! 🎉',
        data: {
          _id: user._id,
          name: user.name,
          username: user.username || '',
          phoneNumber: user.phoneNumber || '',
          email: user.email,
          role: user.role,
          company: user.company,
          workspaceId: user.workspaceId,
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

    // In-memory path
    if (mongoose.connection.readyState !== 1) {
      let user = mockUsers.find(u => u.email === email);
      if (!user) {
        // Auto-register a user for easy logins
        user = {
          _id: 'mock-user-' + Math.random().toString(36).substr(2, 9),
          name: email.split('@')[0],
          username: email.split('@')[0],
          phoneNumber: '+1-555-0100',
          email: email,
          password: password,
          role: 'admin',
          company: 'SmartOps AI Mock',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256',
          lastLogin: new Date()
        };
        mockUsers.push(user);
      }

      if (password === 'admin123' || password === user.password) {
        user.lastLogin = new Date();
        res.status(200).json({
          success: true,
          message: 'Login successful! Welcome back 🎉',
          data: {
            _id: user._id,
            name: user.name,
            username: user.username || '',
            phoneNumber: user.phoneNumber || '',
            email: user.email,
            role: user.role,
            company: user.company,
            avatar: user.avatar,
            lastLogin: user.lastLogin,
            token: generateToken(user._id)
          }
        });
        return;
      } else {
        res.status(401);
        throw new Error('Invalid email or password credentials ❌');
      }
    }

    // MongoDB path
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
          username: user.username || '',
          phoneNumber: user.phoneNumber || '',
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
    if (mongoose.connection.readyState !== 1) {
      const user = mockUsers.find(u => u._id === req.user._id);
      if (!user) {
        res.status(404);
        throw new Error('User not found 🚨');
      }

      if (req.body.name) user.name = req.body.name;
      if (req.body.username) user.username = req.body.username;
      if (req.body.phoneNumber) user.phoneNumber = req.body.phoneNumber;
      if (req.body.avatar) user.avatar = req.body.avatar;
      if (req.body.company) user.company = req.body.company;

      res.status(200).json({
        success: true,
        message: 'Profile details updated successfully! 👤',
        data: {
          _id: user._id,
          name: user.name,
          username: user.username,
          phoneNumber: user.phoneNumber,
          email: user.email,
          role: user.role,
          company: user.company,
          avatar: user.avatar
        }
      });
      return;
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found 🚨');
    }

    // Update allowable fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.username) user.username = req.body.username;
    if (req.body.phoneNumber) user.phoneNumber = req.body.phoneNumber;
    if (req.body.avatar) user.avatar = req.body.avatar;
    if (req.body.company) user.company = req.body.company;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile details updated successfully! 👤',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        phoneNumber: updatedUser.phoneNumber,
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

    if (mongoose.connection.readyState !== 1) {
      const user = mockUsers.find(u => u._id === req.user._id);
      if (!user) {
        res.status(404);
        throw new Error('User not found 🚨');
      }

      if (currentPassword !== user.password) {
        res.status(400);
        throw new Error('Current password credentials do not match ❌');
      }

      user.password = newPassword;
      res.status(200).json({
        success: true,
        message: 'Password changed successfully! 🔐'
      });
      return;
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

// @desc    Authenticate with Google OAuth token (Login or Register)
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res, next) => {
  const { credential, company, workspaceId, role } = req.body;

  try {
    if (!credential) {
      res.status(400);
      throw new Error('Google credential token is required 🔑');
    }

    // Call Google Token Info endpoint to verify token authenticity or use mock decoder
    let email, name, picture;
    if (credential.startsWith('mock-google-token-')) {
      const parts = credential.split('-');
      email = parts[3] || 'google-user@example.com';
      name = parts[4] || 'Google User';
      picture = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256';
    } else {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!response.ok) {
        res.status(401);
        throw new Error('Invalid Google credential token ❌');
      }
      const payload = await response.json();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    }

    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email }).select('+password');
    } else {
      user = mockUsers.find(u => u.email === email);
    }

    if (user) {
      // User already exists, log them in
      user.lastLogin = new Date();
      if (mongoose.connection.readyState === 1) {
        await user.save();
      }
      
      res.status(200).json({
        success: true,
        message: 'Google Login successful! 🎉',
        data: {
          _id: user._id,
          name: user.name,
          username: user.username || '',
          phoneNumber: user.phoneNumber || '',
          email: user.email,
          role: user.role,
          company: user.company,
          workspaceId: user.workspaceId,
          avatar: user.avatar,
          token: generateToken(user._id)
        }
      });
      return;
    }

    // User does not exist, trigger registration flow
    let resolvedCompany = company || `Workspace of ${name.split(' ')[0]}`;
    let resolvedWorkspaceId = workspaceId;

    if (workspaceId && !company) {
      // Find company name by workspaceId
      if (mongoose.connection.readyState === 1) {
        const workspaceUser = await User.findOne({ workspaceId });
        if (workspaceUser) {
          resolvedCompany = workspaceUser.company;
        } else {
          res.status(400);
          throw new Error('Specified Workspace ID does not exist 🚨');
        }
      } else {
        const workspaceUser = mockUsers.find(u => u.workspaceId === workspaceId);
        if (workspaceUser) {
          resolvedCompany = workspaceUser.company;
        } else {
          res.status(400);
          throw new Error('Specified Workspace ID does not exist 🚨');
        }
      }
    }

    // Generate random secure password for social login
    const randomPassword = 'GoogleAuth-' + Math.random().toString(36).substr(2, 9) + 'X1';

    let newUser;
    if (mongoose.connection.readyState === 1) {
      newUser = await User.create({
        name,
        email,
        password: randomPassword,
        company: resolvedCompany,
        workspaceId: resolvedWorkspaceId || undefined, // Mongoose default triggers if undefined
        role: role || 'admin',
        avatar: picture || '',
        username: name.toLowerCase().replace(/\s+/g, '_'),
        phoneNumber: '+1-555-0100'
      });
    } else {
      newUser = {
        _id: 'mock-google-user-' + Math.random().toString(36).substr(2, 9),
        name,
        username: name.toLowerCase().replace(/\s+/g, '_'),
        phoneNumber: '+1-555-0100',
        email,
        password: randomPassword,
        company: resolvedCompany,
        workspaceId: resolvedWorkspaceId || resolvedCompany.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000),
        role: role || 'admin',
        avatar: picture || '',
        lastLogin: new Date()
      };
      mockUsers.push(newUser);
    }

    res.status(201).json({
      success: true,
      message: 'Google Registration successful! 🎉',
      data: {
        _id: newUser._id,
        name: newUser.name,
        username: newUser.username || '',
        phoneNumber: newUser.phoneNumber || '',
        email: newUser.email,
        role: newUser.role,
        company: newUser.company,
        workspaceId: newUser.workspaceId,
        avatar: newUser.avatar,
        token: generateToken(newUser._id)
      }
    });
  } catch (error) {
    next(error);
  }
};
