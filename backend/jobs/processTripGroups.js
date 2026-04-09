const mongoose = require('mongoose');
const Group = require('../models/Group');
const Notification = require('../models/Notification');

async function run() {
  if (mongoose.connection.readyState !== 1) return;

  try {
    // Find trips past their end date that haven't been archived
    const expired = await Group.findExpiredTrips();

    for (const trip of expired) {
      await Group.archiveGroup(trip._id);

      // Notify all members
      const notifications = trip.members.map(memberId => ({
        user: memberId,
        type: 'group_update',
        title: `Trip "${trip.name}" ended`,
        message: `This trip has been automatically archived. View the summary in your archived groups.`,
        metadata: { groupId: trip._id },
      }));

      await Notification.insertMany(notifications).catch(() => {});
    }

    if (expired.length > 0) {
      console.log(`[TripCron] Archived ${expired.length} expired trip(s)`);
    }
  } catch (err) {
    console.error('[TripCron] Error:', err.message);
  }
}

function start() {
  // Run every hour
  setInterval(run, 60 * 60 * 1000);
  // Initial run after 15 seconds (let DB connect first)
  setTimeout(run, 15_000);
  console.log('[TripCron] Trip auto-archive job scheduled (hourly)');
}

module.exports = { start, run };
