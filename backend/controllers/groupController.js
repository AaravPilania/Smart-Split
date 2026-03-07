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
      group: {
        id: group._id,
        name: group.name,
        description: group.description,
        createdBy: {
          id: group.createdBy._id,
          name: group.createdBy.name,
          email: group.createdBy.email
        },
        members: group.members.map(member => ({
          id: member._id,
          name: member.name,
          email: member.email
        })),
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      }
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
      const groups = await Group.find({}).populate('createdBy', 'id name email').populate('members', 'id name email').sort({ createdAt: -1 });

      const formattedGroups = groups.map(group => ({
        id: group._id,
        name: group.name,
        description: group.description,
        createdBy: {
          id: group.createdBy._id,
          name: group.createdBy.name,
          email: group.createdBy.email
        },
        members: group.members.map(member => ({
          id: member._id,
          name: member.name,
          email: member.email
        })),
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      }));

      return res.json({ groups: formattedGroups });
    }

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const groups = await Group.findByUser(userId);

    const formattedGroups = groups.map(group => ({
      id: group._id,
      name: group.name,
      description: group.description,
      createdBy: {
        id: group.createdBy._id,
        name: group.createdBy.name,
        email: group.createdBy.email
      },
      members: group.members.map(member => ({
        id: member._id,
        name: member.name,
        email: member.email
      })),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    }));

    res.json({ groups: formattedGroups });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single group
exports.getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json({
      group: {
        id: group._id,
        name: group.name,
        description: group.description,
        createdBy: {
          id: group.createdBy._id,
          name: group.createdBy.name,
          email: group.createdBy.email
        },
        members: group.members.map(member => ({
          id: member._id,
          name: member.name,
          email: member.email
        })),
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add members to group
exports.addMembers = async (req, res) => {
  try {
    const { memberIds } = req.body;
    const groupId = req.params.id;

    if (!memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({ message: 'memberIds must be an array' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Add members
    await Group.addMembers(groupId, memberIds);

    // Return updated group
    const updatedGroup = await Group.findById(groupId);

    res.json({
      message: 'Members added successfully',
      group: {
        id: updatedGroup._id,
        name: updatedGroup.name,
        description: updatedGroup.description,
        createdBy: {
          id: updatedGroup.createdBy._id,
          name: updatedGroup.createdBy.name,
          email: updatedGroup.createdBy.email
        },
        members: updatedGroup.members.map(member => ({
          id: member._id,
          name: member.name,
          email: member.email
        })),
        createdAt: updatedGroup.createdAt,
        updatedAt: updatedGroup.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
