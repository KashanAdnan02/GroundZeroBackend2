const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const Razorpay = require("razorpay");
const crypto = require("crypto");
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

router.put("/order/validate", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const sha = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = sha.digest("hex");

  if (digest !== razorpay_signature) {
    return res.status(401).json({ msg: "Transaction is not legit!!!!!" });
  }
  const updatedPayment = await Payment.findOneAndUpdate(
    { transactionId: razorpay_payment_id },
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
});

module.exports = router;
