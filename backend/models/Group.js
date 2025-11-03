const { getPool } = require('../config/database');

class Group {
  // Create a new group
  static async create(name, description, createdBy) {
    const pool = getPool();
    
    // Insert group
    const [result] = await pool.execute(
      'INSERT INTO `groups` (name, description, created_by) VALUES (?, ?, ?)',
      [name, description, createdBy]
    );
    
    const groupId = result.insertId;
    
    // Add creator as member
    await this.addMember(groupId, createdBy);
    
    return await this.findById(groupId);
  }

  // Find group by ID
  static async findById(id) {
    const pool = getPool();
    const [groups] = await pool.execute(
      `SELECT g.*, 
       u.id as creator_id, u.name as creator_name, u.email as creator_email
       FROM \`groups\` g
       LEFT JOIN users u ON g.created_by = u.id
       WHERE g.id = ?`,
      [id]
    );
    
    if (groups.length === 0) return null;
    
    const group = groups[0];
    
    // Get members
    const members = await this.getMembers(id);
    group.members = members;
    
    // Format response
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
  }

  // Get all groups for a user
  static async findByUser(userId) {
    const pool = getPool();
    const [groups] = await pool.execute(
      `SELECT DISTINCT g.*, 
       u.id as creator_id, u.name as creator_name, u.email as creator_email
       FROM \`groups\` g
       LEFT JOIN users u ON g.created_by = u.id
       INNER JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = ?
       ORDER BY g.created_at DESC`,
      [userId]
    );
    
    // Get members for each group
    const groupsWithMembers = await Promise.all(
      groups.map(async (group) => {
        const members = await this.getMembers(group.id);
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
    
    return groupsWithMembers;
  }

  // Get members of a group
  static async getMembers(groupId) {
    const pool = getPool();
    const [members] = await pool.execute(
      `SELECT u.id, u.name, u.email 
       FROM group_members gm
       INNER JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?`,
      [groupId]
    );
    return members;
  }

  // Check if user is a member of the group
  static async isMember(groupId, userId) {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    return rows.length > 0;
  }

  // Add member to group
  static async addMember(groupId, userId) {
    const pool = getPool();
    
    // Check if already a member
    const isMember = await this.isMember(groupId, userId);
    if (isMember) {
      return false;
    }
    
    await pool.execute(
      'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
      [groupId, userId]
    );
    
    return true;
  }

  // Add multiple members to group
  static async addMembers(groupId, userIds) {
    const pool = getPool();
    
    for (const userId of userIds) {
      const isMember = await this.isMember(groupId, userId);
      if (!isMember) {
        await pool.execute(
          'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
          [groupId, userId]
        );
      }
    }
    
    return true;
  }
}

module.exports = Group;
