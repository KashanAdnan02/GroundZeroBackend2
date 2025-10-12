const processPayment = async (paymentData) => {
  const { amount, payment_method, card_details, upi_id, wallet_id } = paymentData;
  
  try {
    let paymentResult = {
      success: false,
      payment_id: null,
      transaction_id: null,
      message: ''
    };

    switch (payment_method) {
      case 'card':
        paymentResult = await processCardPayment(amount, card_details);
        break;
      case 'upi':
        paymentResult = await processUPIPayment(amount, upi_id);
        break;
      case 'wallet':
        paymentResult = await processWalletPayment(amount, wallet_id);
        break;
      case 'cash':
        paymentResult = {
          success: true,
          payment_id: `CASH_${Date.now()}`,
          transaction_id: `TXN_${Date.now()}`,
          message: 'Cash payment recorded'
        };
        break;
      default:
        throw new Error('Invalid payment method');
    }

    return paymentResult;
  } catch (error) {
    return {
      success: false,
      payment_id: null,
      transaction_id: null,
      message: error.message
    };
  }
};

const processCardPayment = async (amount, cardDetails) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.1;
      resolve({
        success,
        payment_id: success ? `CARD_${Date.now()}` : null,
        transaction_id: success ? `TXN_${Date.now()}` : null,
        message: success ? 'Card payment successful' : 'Card payment failed'
      });
    }, 2000);
  });
};

const processUPIPayment = async (amount, upiId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.05;
      resolve({
        success,
        payment_id: success ? `UPI_${Date.now()}` : null,
        transaction_id: success ? `TXN_${Date.now()}` : null,
        message: success ? 'UPI payment successful' : 'UPI payment failed'
      });
    }, 1500);
  });
};

const processWalletPayment = async (amount, walletId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.02;
      resolve({
        success,
        payment_id: success ? `WALLET_${Date.now()}` : null,
        transaction_id: success ? `TXN_${Date.now()}` : null,
        message: success ? 'Wallet payment successful' : 'Insufficient wallet balance'
      });
    }, 1000);
  });
};

const processRefund = async (paymentId, amount, reason) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.05;
      resolve({
        success,
        refund_id: success ? `REF_${Date.now()}` : null,
        refund_amount: success ? amount : 0,
        message: success ? 'Refund processed successfully' : 'Refund processing failed'
      });
    }, 3000);
  });
};

const calculateLateFee = (overdueMinutes, baseRate = 5) => {
  return Math.ceil(overdueMinutes / 15) * baseRate;
};

const calculateCancellationFee = (hoursUntilStart, totalAmount) => {
  if (hoursUntilStart >= 24) {
    return 0;
  } else if (hoursUntilStart >= 2) {
    return totalAmount * 0.1;
  } else {
    return totalAmount * 0.25;
  }
};

module.exports = {
  processPayment,
  processRefund,
  calculateLateFee,
  calculateCancellationFee
};