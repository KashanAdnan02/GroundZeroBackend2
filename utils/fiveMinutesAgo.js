const cron = require("node-cron");
const Booking = require("../models/Booking");

function startBookingCleanupJob() {
  cron.schedule("* * * * *", async () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    try {
      const result = await Booking.deleteMany({
        booking_status: "pending",
        payment_status: "pending",
        createdAt: { $lt: fiveMinutesAgo },
      });

      if (result.deletedCount > 0) {
        console.log(`🧹 [${new Date().toISOString()}] Deleted ${result.deletedCount} pending bookings.`);
      }
    } catch (err) {
      console.error("❌ Error in booking cleanup job:", err.message);
    }
  });
}

module.exports = startBookingCleanupJob;
