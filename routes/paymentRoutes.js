const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const Razorpay = require("razorpay");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post("/create-order", async (req, res) => {
  const options = {
    amount: req.body.amount * 100,
    currency: "INR",
  };

  const order = await instance.orders.create(options);
  res.status(200).json({
    success: true,
    order,
  });
});

router.put("/capture/:id", async (req, res) => {
  const paymentId = req.params.id;
  const { amount } = req.body; // amount should be in paise (e.g., ₹100.00 = 10000)

  if (!amount) {
    return res
      .status(400)
      .json({ error: "Amount is required in the request body (in paise)" });
  }

  try {
    const response = await instance.payments.capture(paymentId, amount);

    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: paymentId },
      {
        status: "completed",
        paidAt: new Date(),
      },
      { new: true }
    );
    const updatedBooking = await Booking.findByIdAndUpdate(
      updatedPayment.bookingId,
      {
        status: "completed",
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Payment captured successfully",
      razorpayResponse: response,
      updatedPayment,
    });
  } catch (error) {
    console.error("Razorpay capture error:", error);
    return res.status(500).json({
      error: "Failed to capture payment",
      details: error.error || error.message || error,
    });
  }
});

module.exports = router;
