import express from 'express';
import { protect } from '../../../middleware/authenticationMiddleware.js';
import { signup, login, forgotPassword, resetPassword, updatePassword, getAllUsers, getUser, updateUser, deleteUser } from '../controller/user.js';
import User from '../model/user.js';

const router = express.Router();

// Public routes
router.post('/signup', async (req, res) => {
  const result = await signup(req);
  res.status(result.status_code).json(result);
});

router.post('/login', async (req, res) => {
  const result = await login(req);
  res.status(result.status_code).json(result);
});

router.post('/forgot-password', async (req, res) => {
  const result = await forgotPassword(req);
  res.status(result.status_code).json(result);
});

router.patch('/reset-password/:token', async (req, res) => {
  const result = await resetPassword(req);
  res.status(result.status_code).json(result);
});

// Protected routes
router.use(protect(User));

router.patch('/update-password', async (req, res) => {
  const result = await updatePassword(req);
  res.status(result.status_code).json(result);
});

router.route('/')
  .get(async (req, res) => {
    const result = await getAllUsers(req);
    res.status(result.status_code).json(result);
  })
  .post(async (req, res) => {
    const result = await signup(req);
    res.status(result.status_code).json(result);
  });

router.route('/:id')
  .get(async (req, res) => {
    const result = await getUser(req);
    res.status(result.status_code).json(result);
  })
  .patch(async (req, res) => {
    const result = await updateUser(req);
    res.status(result.status_code).json(result);
  })
  .delete(async (req, res) => {
    const result = await deleteUser(req);
    res.status(result.status_code).json(result);
  });

export default router;