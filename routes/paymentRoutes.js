const express = require("express");
const router = express.Router();
// const razorpay = require("../config/razorpayClient"); // adjust path as needed
const Payment = require("../models/Payment");
const razorpayClient = require("../config/razorpayClient");

router.post("/create-order", async (req, res) => {
  const options = {
    amount: 1000 * 100,
    currency: "INR",
  };

  const order = await razorpayClient.orders.create(options);
  res.status(200).json({
    success: true,
    order,
  });
});

router.put("/payments/:id/capture", async (req, res) => {
  const paymentId = req.params.id;
  const { amount } = req.body; // amount should be in paise (e.g., ₹100.00 = 10000)

  if (!amount) {
    return res
      .status(400)
      .json({ error: "Amount is required in the request body (in paise)" });
  }

  try {
    // Call Razorpay's capture API
    const response = await razorpay.payments.capture(paymentId, amount);

    // Optionally, update your local DB
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: paymentId },
      {
        status: "completed",
        paidAt: new Date(),
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
