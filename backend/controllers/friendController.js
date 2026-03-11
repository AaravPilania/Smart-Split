const Friendship = require('../models/Friendship');
const User = require('../models/User');

// POST /api/friends/request/:recipientId
// Send a friend request to recipientId
exports.sendRequest = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { recipientId } = req.params;

    if (requesterId === recipientId) {
      return res.status(400).json({ message: "You can't add yourself as a friend" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ message: 'User not found' });

    // Check for existing friendship in either direction
    const existing = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted') return res.status(400).json({ message: 'Already friends' });
      if (existing.status === 'pending') return res.status(400).json({ message: 'Friend request already sent' });
      // If rejected, allow re-send by updating status
      if (existing.status === 'rejected') {
        existing.status = 'pending';
        existing.requester = requesterId;
        existing.recipient = recipientId;
        await existing.save();
        return res.json({ message: 'Friend request sent', friendship: existing });
      }
    }

    const friendship = await Friendship.create({ requester: requesterId, recipient: recipientId });
    res.status(201).json({ message: 'Friend request sent', friendship });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Friend request already exists' });
    res.status(500).json({ message: err.message });
  }
};

// GET /api/friends
// Get all accepted friends for the logged-in user
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendships = await Friendship.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'accepted',
    })
      .populate('requester', 'name email')
      .populate('recipient', 'name email');

    const friends = friendships.map((f) => {
      const friend = f.requester._id.toString() === userId ? f.recipient : f.requester;
      return { id: friend._id, name: friend.name, email: friend.email, friendshipId: f._id };
    });

    res.json({ friends });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/friends/requests
// Get incoming pending friend requests
exports.getIncomingRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await Friendship.find({ recipient: userId, status: 'pending' }).populate(
      'requester',
      'name email'
    );
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/friends/accept/:friendshipId
exports.acceptRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const f = await Friendship.findById(req.params.friendshipId);
    if (!f) return res.status(404).json({ message: 'Request not found' });
    if (f.recipient.toString() !== userId) return res.status(403).json({ message: 'Not authorised' });
    f.status = 'accepted';
    await f.save();
    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/friends/reject/:friendshipId
exports.rejectRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const f = await Friendship.findById(req.params.friendshipId);
    if (!f) return res.status(404).json({ message: 'Request not found' });
    if (f.recipient.toString() !== userId) return res.status(403).json({ message: 'Not authorised' });
    f.status = 'rejected';
    await f.save();
    res.json({ message: 'Friend request rejected' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/friends/:friendId
// Remove an accepted friend
exports.removeFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;
    await Friendship.deleteOne({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId },
      ],
      status: 'accepted',
    });
    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
