import { DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';
import BaseModel from '../../baseModel.js';

class User extends BaseModel {
  static async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  async validatePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  }
}

User.init({
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [8, 100]
    }
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  passwordChangeAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  location: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      country: '',
      city: '',
      state: '',
      postalCode: '',
      address: ''
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'vendor', 'school', 'driver', 'parent'),
    defaultValue: 'admin'
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  FCMTokens: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        user.password = await User.hashPassword(user.password);
        user.passwordChangeAt = new Date();
      }
    }
  },
  tableName: 'users',
  modelName: 'User'
});

export default User;