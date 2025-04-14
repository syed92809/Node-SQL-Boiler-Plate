import { Model, DataTypes } from 'sequelize';
import sequelize from '../bin/database.js';

class BaseModel extends Model {
  static init(modelAttributes, options = {}) {
    const baseAttributes = {
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    };

    return super.init(
      { ...modelAttributes, ...baseAttributes },
      { 
        sequelize,
        ...options,
        hooks: {
          beforeUpdate: async (instance) => {
            instance.updatedAt = new Date();
          },
          ...options.hooks
        }
      }
    );
  }
}

export default BaseModel;