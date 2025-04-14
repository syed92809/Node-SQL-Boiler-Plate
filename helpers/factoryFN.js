import { Op } from 'sequelize';
import { _responseWrapper } from './util-response.js';

// Validate if the provided id is a valid number
const validateId = (id) => !isNaN(id) && Number.isInteger(Number(id));

// Handle pagination parameters
const handlePagination = (query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const offset = (page - 1) * limit;
  return { limit, offset };
};

// Handle sorting parameters
const handleSort = (query) => {
  if (!query.sort) return [['createdAt', 'DESC']];
  return query.sort.split(',').map(field => {
    const order = field.startsWith('-') ? 'DESC' : 'ASC';
    const column = field.replace(/^-/, '');
    return [column, order];
  });
};

// Handle filtering parameters
const handleFilter = (query) => {
  const filter = {};
  Object.keys(query).forEach(key => {
    if (!['page', 'limit', 'sort', 'fields'].includes(key)) {
      if (typeof query[key] === 'string' && query[key].includes(',')) {
        filter[key] = { [Op.in]: query[key].split(',') };
      } else {
        filter[key] = query[key];
      }
    }
  });
  return filter;
};

// Create document
export const createDoc = (Model) => async (req) => {
  try {
    const doc = await Model.create({
      ...req.body,
      createdBy: req.user?.id
    });
    return _responseWrapper(true, 'createSuccess', 201, { data: doc });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return _responseWrapper(false, error.errors[0].message, 409);
    }
    return _responseWrapper(false, error.message, 400);
  }
};

// Get documents
export const getDocs = (Model, options = {}) => async (req) => {
  try {
    const { single = false, include = [] } = options;
    const { id } = req.params;
    
    if (id) {
      if (!validateId(id)) return _responseWrapper(false, 'invalidId', 400);
      
      const doc = await Model.findByPk(id, { include });
      if (!doc) return _responseWrapper(false, 'notFound', 404);
      
      return _responseWrapper(true, 'fetchSuccess', 200, { data: doc });
    }

    const pagination = handlePagination(req.query);
    const order = handleSort(req.query);
    const where = handleFilter(req.query);

    const { count, rows } = await Model.findAndCountAll({
      where,
      ...pagination,
      order,
      include
    });

    if (single && rows.length > 0) {
      return _responseWrapper(true, 'fetchSuccess', 200, { data: rows[0], count });
    }

    return _responseWrapper(true, 'fetchSuccess', 200, { data: rows, count });
  } catch (error) {
    return _responseWrapper(false, error.message, 400);
  }
};

// Update document
export const updateDoc = (Model) => async (req) => {
  try {
    const { id } = req.params;
    if (!validateId(id)) return _responseWrapper(false, 'invalidId', 400);

    const doc = await Model.findByPk(id);
    if (!doc) return _responseWrapper(false, 'notFound', 404);

    const updatedDoc = await doc.update(req.body);
    return _responseWrapper(true, 'updateSuccess', 200, { data: updatedDoc });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return _responseWrapper(false, error.errors[0].message, 409);
    }
    return _responseWrapper(false, error.message, 400);
  }
};

// Delete document
export const deleteDoc = (Model) => async (req) => {
  try {
    const { id } = req.params;
    if (!validateId(id)) return _responseWrapper(false, 'invalidId', 400);

    const doc = await Model.findByPk(id);
    if (!doc) return _responseWrapper(false, 'notFound', 404);

    // Soft delete if the model has isDeleted field
    if (Object.keys(Model.rawAttributes).includes('isDeleted')) {
      await doc.update({ isDeleted: true });
    } else {
      await doc.destroy();
    }

    return _responseWrapper(true, 'deleteSuccess', 200, { data: doc });
  } catch (error) {
    return _responseWrapper(false, error.message, 400);
  }
};