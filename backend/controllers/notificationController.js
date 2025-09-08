import DoctorProfile from "../models/doctorProfile.js";

export const sendProfileStatusNotification = async (req, res) => {
  try {
    const { profileId, status } = req.body;
    
    if (!profileId || !status) {
      return res.status(400).json({ 
        success: false, 
        message: "Profile ID and status are required" 
      });
    }

    // Get the profile details
    const profile = await DoctorProfile.findById(profileId).populate('userId', 'name email');
    
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: "Profile not found" 
      });
    }

    // In a real application, you would send an email or push notification here
    // For now, we'll just log the notification
    const notificationMessage = status === 'approved' 
      ? `Congratulations ${profile.name}! Your doctor profile has been approved. You can now proceed to payment.`
      : `Hello ${profile.name}, unfortunately your doctor profile has been rejected. You can continue using the platform as a patient.`;
    
    console.log(`NOTIFICATION: ${notificationMessage}`);
    console.log(`Email would be sent to: ${profile.userId.email}`);
    
    // You could integrate with email services like SendGrid, Nodemailer, etc.
    // await sendEmail(profile.userId.email, 'Profile Status Update', notificationMessage);
    
    // You could also integrate with push notification services like Firebase
    // await sendPushNotification(profile.userId._id, notificationMessage);

    return res.json({
      success: true,
      message: "Notification sent successfully",
      notification: {
        recipient: profile.userId.email,
        message: notificationMessage,
        status: status
      }
    });
    
  } catch (err) {
    console.error('Error sending notification:', err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};
