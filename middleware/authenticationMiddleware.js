import { verifyToken } from '../helpers/util-jwt.js';
import { _res } from '../helpers/util-response.js';
import { getSession, cacheInstance } from '../helpers/util-Cache.js';

// Function to validate the token format
export const validTokenStr = (token) => {
    if (!token.startsWith('Bearer ')) return false;
    return token.split(' ')[1];
};

// Function to verify the token and return the verified user information
export const verifyUserToken = async (token) => {
    const verified = await verifyToken(token);
    if (!verified) {
        throw new Error('Authorization failed: invalid token');
    }
    return verified;
};

// Function to check session cache for token validity
export const checkSessionCache = async (token) => {
    const cache = await getSession(cacheInstance["session-cache"], token);
    if (!cache) {
        throw new Error('Authorization failed: invalid token');
    }
};

// Function to retrieve user from the database
export const getUserFromDatabase = async (id, User) => {
    const user = await User.findOne({
        where: { id, isDeleted: false }
    });

    if (!user) {
        throw new Error('Your provided token is not valid, please provide a valid token');
    }

    return user;
};

// Function to check if the user's password has changed
export const checkPasswordChange = (userData, iat) => {
    if (userData.passwordChangeAt && new Date(userData.passwordChangeAt).getTime() > iat * 1000) {
        throw new Error('Your password has been changed, please log in again');
    }
};

// Main protect function that uses the helper functions
export const protect = (User) => async (req, res, next) => {
    try {
        let { FCMToken = null } = req.body;

        // 1) Get user token and validate it
        const { authorization: token } = req.headers;
        if (!token || !validTokenStr(token)) return _res({ res });

        const strippedToken = validTokenStr(token); // Remove the 'Bearer ' prefix from the token
        const verified = await verifyUserToken(strippedToken);

        const { id, iat } = verified;

        // 2) Check in session-cache
        await checkSessionCache(strippedToken);

        // 3) Get user data from the database
        const user = await getUserFromDatabase(id, User);

        // 4) Check if the password has changed
        checkPasswordChange(user, iat);

        // 5) Add FCM token to the user's FCMTokens array if needed
        if (FCMToken) {
            const fcmTokens = user.FCMTokens || [];
            if (!fcmTokens.includes(FCMToken)) {
                fcmTokens.push(FCMToken);
                await user.update({ FCMTokens: fcmTokens });
            }
            delete req.body.FCMToken;
        }

        // Assign user data to request object
        req.user = user;
        req.userId = user.id.toString();
        next();
    } catch (e) {
        return _res({ res, status: false, message: e.message, code: 401 });
    }
};