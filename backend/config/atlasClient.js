const crypto = require('crypto');

/**
 * Atlas Data API client — communicates with MongoDB over HTTPS (port 443).
 * Bypasses ISP blocks on port 27017.
 */

async function apiCall(action, body) {
  const url = process.env.ATLAS_DATA_API_URL;
  const apiKey = process.env.ATLAS_DATA_API_KEY;

  const response = await fetch(`${url}/action/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      dataSource: process.env.ATLAS_DATA_SOURCE,
      database: process.env.ATLAS_DATABASE || 'splitwise',
      ...body
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Atlas Data API (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Convert EJSON types (ObjectId, Date, etc.) to plain JS values
function normalize(doc) {
  if (doc === null || doc === undefined) return null;
  if (Array.isArray(doc)) return doc.map(normalize);
  if (typeof doc !== 'object') return doc;

  if ('$oid' in doc) return doc.$oid;
  if ('$date' in doc) return new Date(doc.$date);
  if ('$numberDouble' in doc) return parseFloat(doc.$numberDouble);
  if ('$numberInt' in doc) return parseInt(doc.$numberInt);
  if ('$numberLong' in doc) return parseInt(doc.$numberLong);
  if ('$numberDecimal' in doc) return parseFloat(doc.$numberDecimal);

  const result = {};
  for (const [key, value] of Object.entries(doc)) {
    result[key] = normalize(value);
  }
  if (result._id !== undefined) result.id = result._id;
  return result;
}

// Convert a string ID to EJSON ObjectId for use in filters
function oid(id) {
  if (!id) return null;
  if (typeof id === 'object' && id !== null && '$oid' in id) return id;
  return { '$oid': String(id) };
}

// Convert a JS Date to EJSON Date for use in documents
function dateVal(d) {
  if (!d) return { '$date': new Date().toISOString() };
  if (d instanceof Date) return { '$date': d.toISOString() };
  return { '$date': new Date(d).toISOString() };
}

// Generate a 24-char hex ID (same format as MongoDB ObjectId)
function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

module.exports = {
  async findOne(collection, filter, projection) {
    const body = { collection, filter };
    if (projection) body.projection = projection;
    const result = await apiCall('findOne', body);
    return normalize(result.document);
  },

  async find(collection, filter, options = {}) {
    const body = { collection, filter };
    if (options.projection) body.projection = options.projection;
    if (options.sort) body.sort = options.sort;
    if (options.limit) body.limit = options.limit;
    const result = await apiCall('find', body);
    return (result.documents || []).map(normalize);
  },

  async insertOne(collection, document) {
    const result = await apiCall('insertOne', { collection, document });
    return result.insertedId;
  },

  async updateOne(collection, filter, update) {
    return apiCall('updateOne', { collection, filter, update });
  },

  async deleteOne(collection, filter) {
    return apiCall('deleteOne', { collection, filter });
  },

  async aggregate(collection, pipeline) {
    const result = await apiCall('aggregate', { collection, pipeline });
    return (result.documents || []).map(normalize);
  },

  oid,
  dateVal,
  normalize,
  generateId,

  // Health check — try reading from the DB over HTTPS
  async ping() {
    await apiCall('find', { collection: 'users', filter: {}, limit: 1 });
    return true;
  }
};
