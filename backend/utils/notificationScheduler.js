// import cron from 'node-cron'; // TODO: Install node-cron with: npm install node-cron
import Subscription from '../models/Subscription.js';
import { createNotification } from '../controllers/notificationController.js';

// Check for expiring/expired subscriptions daily at 9 AM
export const startNotificationScheduler = () => {
  // TODO: Uncomment when node-cron is installed
  // Run daily at 9:00 AM
  // cron.schedule('0 9 * * *', async () => {
  //   console.log('Running subscription expiry check...');
  //   await checkExpiringSubscriptions();
  // });

  // Run every 30 minutes for testing (using setInterval instead of cron for now)
  setInterval(async () => {
    console.log('Running subscription expiry check...');
    await checkExpiringSubscriptions();
  }, 30 * 60 * 1000); // 30 minutes

  // Also run immediately when server starts (for testing)
  setTimeout(() => {
    checkExpiringSubscriptions();
  }, 5000);
};

export const checkExpiringSubscriptions = async () => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    // Find subscriptions expiring in next 3 days
    const expiringSoon = await Subscription.find({
      isActive: true,
      endDate: {
        $gte: now,
        $lte: threeDaysFromNow
      }
    });

    // Find already expired subscriptions that are still marked active
    const expired = await Subscription.find({
      isActive: true,
      endDate: { $lt: now }
    });

    // Process expiring subscriptions
    for (const sub of expiringSoon) {
      const daysLeft = Math.ceil((sub.endDate - now) / (1000 * 60 * 60 * 24));
      
      await createNotification(
        sub.doctorId,
        "subscription_expiring",
        "Subscription Expiring Soon",
        `Your subscription will expire in ${daysLeft} day(s). Renew now to avoid service interruption.`,
        { subscriptionId: sub._id, daysLeft }
      );
    }

    // Process expired subscriptions
    for (const sub of expired) {
      // Mark as inactive
      sub.isActive = false;
      await sub.save();
      
      await createNotification(
        sub.doctorId,
        "subscription_expired",
        "Subscription Expired",
        "Your subscription has expired. Please renew to continue using doctor features.",
        { subscriptionId: sub._id }
      );
    }

    console.log(`Processed ${expiringSoon.length} expiring and ${expired.length} expired subscriptions`);
  } catch (error) {
    console.error('Error checking subscription expiry:', error);
  }
};

export default { startNotificationScheduler, checkExpiringSubscriptions };
