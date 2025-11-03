const Group = require('../models/Group');

// Create group
exports.createGroup = async (req, res) => {
  try {
    const { name, description, createdBy } = req.body;

    if (!createdBy) {
      return res.status(400).json({ message: 'createdBy is required' });
    }

    const group = await Group.create(name, description, createdBy);

    res.status(201).json({
      message: 'Group created successfully',
      group
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all groups
exports.getGroups = async (req, res) => {
  try {
    const { userId, all } = req.query;

    // If 'all' parameter is true, return all groups (for discovery)
    if (all === 'true') {
      const { getPool } = require('../config/database');
      const pool = getPool();
      const [groups] = await pool.execute(
        `SELECT g.*, 
         u.id as creator_id, u.name as creator_name, u.email as creator_email
         FROM \`groups\` g
         LEFT JOIN users u ON g.created_by = u.id
         ORDER BY g.created_at DESC`
      );
      
      // Get members for each group
      const groupsWithMembers = await Promise.all(
        groups.map(async (group) => {
          const members = await Group.getMembers(group.id);
          return {
            id: group.id,
            name: group.name,
            description: group.description,
            createdBy: {
              id: group.created_by,
              name: group.creator_name,
              email: group.creator_email
            },
            members: members,
            createdAt: group.created_at,
            updatedAt: group.updated_at
          };
        })
      );
      
      return res.json({ groups: groupsWithMembers });
    }

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const groups = await Group.findByUser(parseInt(userId));

    res.json({ groups });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single group
exports.getGroup = async (req, res) => {
  try {
    const group = await Group.findById(parseInt(req.params.id));

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json({ group });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add members to group
exports.addMembers = async (req, res) => {
  try {
    const { memberIds } = req.body;
    const groupId = parseInt(req.params.id);

    if (!memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({ message: 'memberIds must be an array' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Add members
    await Group.addMembers(groupId, memberIds.map(id => parseInt(id)));

    // Return updated group
    const updatedGroup = await Group.findById(groupId);

    res.json({
      message: 'Members added successfully',
      group: updatedGroup
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
