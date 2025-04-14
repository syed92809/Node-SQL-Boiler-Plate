import User from '../model/user.js';
import { createDoc, getDocs, updateDoc, deleteDoc } from '../../../helpers/factoryFN.js';
import { _responseWrapper } from '../../../helpers/util-response.js';
import { generateToken } from '../../../helpers/util-jwt.js';

// Factory functions
export const getAllUsers = getDocs(User);
export const getUser = getDocs(User, { single: true });
export const updateUser = updateDoc(User);
export const deleteUser = deleteDoc(User);

// Custom controller functions
export const signup = async (req) => {
  try {
    const { email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return _responseWrapper(false, 'User already exists with this email', 409);
    }

    // Use createDoc factory function to create user
    const result = await createDoc(User)(req);
    if (!result.status) return result;

    // Generate token
    const token = generateToken({ id: result.data.id });

    return _responseWrapper(true, 'User registered successfully', 201, {
      data: { ...result.data.toJSON(), token }
    });
  } catch (error) {
    return _responseWrapper(false, error.message, 400);
  }
};

export const login = async (req) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return _responseWrapper(false, 'Please provide email and password', 400);
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.validatePassword(password))) {
      return _responseWrapper(false, 'Incorrect email or password', 401);
    }

    // Generate token
    const token = generateToken({ id: user.id });

    return _responseWrapper(true, 'LoginSuccess', 200, {
      data: { ...user.toJSON(), token }
    });
  } catch (error) {
    return _responseWrapper(false, error.message, 400);
  }
};

export const forgotPassword = async (req) => {
  try {
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return _responseWrapper(false, 'There is no user with this email address', 404);
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).slice(-8);
    const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.update({
      passwordResetToken: resetToken,
      passwordResetExpires
    });

    // TODO: Send reset token via email

    return _responseWrapper(true, 'Token sent to email', 200);
  } catch (error) {
    return _responseWrapper(false, error.message, 400);
  }
};

export const resetPassword = async (req) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() }
      }
    });

    if (!user) {
      return _responseWrapper(false, 'Token is invalid or has expired', 400);
    }

    // Update password
    await user.update({
      password,
      passwordResetToken: null,
      passwordResetExpires: null
    });

    return _responseWrapper(true, 'Password reset successful', 200);
  } catch (error) {
    return _responseWrapper(false, error.message, 400);
  }
};

export const updatePassword = async (req) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { user } = req;

    // Check current password
    if (!(await user.validatePassword(currentPassword))) {
      return _responseWrapper(false, 'Current password is incorrect', 401);
    }

    // Update password
    await user.update({ password: newPassword });

    // Generate new token
    const token = generateToken({ id: user.id });

    return _responseWrapper(true, 'Password updated successfully', 200, {
      data: { token }
    });
  } catch (error) {
    return _responseWrapper(false, error.message, 400);
  }
};