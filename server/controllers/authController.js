import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Streak from '../models/Streak.js';
import LearningDNA from '../models/LearningDNA.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(googleClientId);

const generateToken = (id, role = 'user') => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'studyflow_super_secret_jwt_key_2026_production_quality',
    { expiresIn: '30d' }
  );
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, dailyStudyGoalMinutes, preferredStudyTime } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Email syntax validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'user',
      emailVerified: true,
      oauthProvider: 'local',
      dailyStudyGoalMinutes: dailyStudyGoalMinutes || 120,
      preferredStudyTime: preferredStudyTime || 'evening',
      xp: 0,
      level: 1,
      badges: []
    });

    await Streak.create({
      user: user._id,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: ''
    });

    await LearningDNA.create({
      user: user._id,
      peakTime: 'Pending study data',
      averageSessionDurationMinutes: 0,
      bestPerformingDays: [],
      averageFocusDuration: 0,
      completionConsistencyScore: 0
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        level: user.level,
        xp: user.xp,
        dailyStudyGoalMinutes: user.dailyStudyGoalMinutes,
        preferredStudyTime: user.preferredStudyTime,
        streak: 0,
        longestStreak: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if account was deactivated by an admin
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.'
      });
    }

    const streak = await Streak.findOne({ user: user._id });

    res.json({
      success: true,
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        level: user.level,
        xp: user.xp,
        badges: user.badges || [],
        dailyStudyGoalMinutes: user.dailyStudyGoalMinutes,
        weeklyStudyGoalHours: user.weeklyStudyGoalHours,
        availableHoursPerDay: user.availableHoursPerDay,
        preferredStudyTime: user.preferredStudyTime,
        streak: streak ? streak.currentStreak : 0,
        longestStreak: streak ? streak.longestStreak : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Google OAuth Login / Registration Endpoint
export const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required.'
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId
    });
    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google credential.'
      });
    }

    const {
      sub: googleId,
      email,
      name,
      picture: avatar,
      email_verified: emailVerified
    } = payload;

    if (!email || !emailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Google email could not be verified.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      if (user.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact the administrator.'
        });
      }

      user.oauthProvider = 'google';
      user.oauthProviderId = googleId;
      user.emailVerified = true;
      if (avatar) {
        user.avatar = avatar;
      }

      await user.save();
    } else {
      user = await User.create({
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: crypto.randomBytes(32).toString('hex'),
        role: 'user',
        emailVerified: true,
        oauthProvider: 'google',
        oauthProviderId: googleId,
        avatar: avatar || '',
        xp: 0,
        level: 1,
        badges: []
      });

      await Streak.create({
        user: user._id,
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: ''
      });

      await LearningDNA.create({
        user: user._id,
        peakTime: 'Pending study data',
        averageSessionDurationMinutes: 0,
        bestPerformingDays: [],
        averageFocusDuration: 0,
        completionConsistencyScore: 0
      });
    }

    const streak = await Streak.findOne({ user: user._id });

    return res.json({
      success: true,
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        level: user.level,
        xp: user.xp,
        badges: user.badges || [],
        dailyStudyGoalMinutes: user.dailyStudyGoalMinutes,
        preferredStudyTime: user.preferredStudyTime,
        streak: streak ? streak.currentStreak : 0,
        longestStreak: streak ? streak.longestStreak : 0
      }
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Google authentication failed.'
    });
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const streak = await Streak.findOne({ user: req.user._id });
    res.json({
      success: true,
      user: {
        ...user.toObject(),
        streak: streak ? streak.currentStreak : 0,
        longestStreak: streak ? streak.longestStreak : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { name, dailyStudyGoalMinutes, weeklyStudyGoalHours, availableHoursPerDay, preferredStudyTime, preferredLanguage } = req.body;
    if (name) user.name = name;
    if (dailyStudyGoalMinutes) user.dailyStudyGoalMinutes = dailyStudyGoalMinutes;
    if (weeklyStudyGoalHours) user.weeklyStudyGoalHours = weeklyStudyGoalHours;
    if (availableHoursPerDay) user.availableHoursPerDay = availableHoursPerDay;
    if (preferredStudyTime) user.preferredStudyTime = preferredStudyTime;
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;

    await user.save();
    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your account email address.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user found with this email address.' });
    }

    // Generate reset token via user method
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Construct reset URL
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientBaseUrl}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(user, resetUrl, resetToken);

      res.json({
        success: true,
        message: 'Password reset link and code sent to your email address.',
        resetToken // returned for testing & simulated environments
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be dispatched. Please try again later.' });
    }
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const token = req.params.token || req.body.token;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Reset token is required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    // Hash the token to compare with database hash
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};
