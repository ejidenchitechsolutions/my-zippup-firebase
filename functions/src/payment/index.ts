import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { db, collections, createDocument, updateDocument, getDocument, queryDocuments, runTransaction } from '../utils/firebase';
import { Wallet, Transaction, Booking, User, ApiResponse } from '../types';
import { validateRequest, createTransactionSchema } from '../utils/validation';
import { v4 as uuidv4 } from 'uuid';

// Initialize Stripe
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
});

// Create wallet (automatically created when user registers)
export const createWallet = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Check if wallet already exists
    const existingWallet = await queryDocuments<Wallet>(
      collections.wallets,
      [{ field: 'userId', operator: '==', value: context.auth.uid }]
    );

    if (existingWallet.length > 0) {
      throw new functions.https.HttpsError('already-exists', 'Wallet already exists');
    }

    const walletData: Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: context.auth.uid,
      balance: 0,
      currency: 'USD',
      isActive: true,
    };

    const walletId = uuidv4();
    const wallet = await createDocument<Wallet>(collections.wallets, walletId, walletData);

    const response: ApiResponse<Wallet> = {
      success: true,
      data: wallet as Wallet,
      message: 'Wallet created successfully',
    };

    return response;
  } catch (error) {
    console.error('Error creating wallet:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Get wallet balance
export const getWalletBalance = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const wallets = await queryDocuments<Wallet>(
      collections.wallets,
      [{ field: 'userId', operator: '==', value: context.auth.uid }]
    );

    if (wallets.length === 0) {
      throw new functions.https.HttpsError('not-found', 'Wallet not found');
    }

    const wallet = wallets[0];

    const response: ApiResponse<{ balance: number; currency: string }> = {
      success: true,
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
      },
    };

    return response;
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Top up wallet using Stripe
export const topUpWallet = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { amount, paymentMethodId } = data;

    if (!amount || amount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid amount');
    }

    if (!paymentMethodId) {
      throw new functions.https.HttpsError('invalid-argument', 'Payment method required');
    }

    // Get user wallet
    const wallets = await queryDocuments<Wallet>(
      collections.wallets,
      [{ field: 'userId', operator: '==', value: context.auth.uid }]
    );

    if (wallets.length === 0) {
      throw new functions.https.HttpsError('not-found', 'Wallet not found');
    }

    const wallet = wallets[0];

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: wallet.currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      return_url: 'https://zippup.app/payment/return',
    });

    // Create transaction record
    const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: context.auth.uid,
      walletId: wallet.id,
      type: 'topup',
      amount,
      currency: wallet.currency,
      status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
      description: 'Wallet top-up',
      reference: paymentIntent.id,
      paymentMethod: 'stripe',
      metadata: {
        paymentIntentId: paymentIntent.id,
      },
    };

    const transactionId = uuidv4();
    await createDocument<Transaction>(collections.transactions, transactionId, transactionData);

    // If payment succeeded, update wallet balance
    if (paymentIntent.status === 'succeeded') {
      await updateDocument<Wallet>(collections.wallets, wallet.id, {
        balance: wallet.balance + amount,
      });
    }

    const response: ApiResponse = {
      success: true,
      data: {
        transactionId,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
        },
      },
      message: paymentIntent.status === 'succeeded' 
        ? 'Wallet topped up successfully' 
        : 'Payment processing...',
    };

    return response;
  } catch (error) {
    console.error('Error topping up wallet:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Process payment for booking
export const processBookingPayment = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { bookingId, paymentMethod } = data;

    if (!bookingId) {
      throw new functions.https.HttpsError('invalid-argument', 'Booking ID required');
    }

    if (!paymentMethod || !['wallet', 'stripe'].includes(paymentMethod)) {
      throw new functions.https.HttpsError('invalid-argument', 'Valid payment method required');
    }

    // Get booking
    const booking = await getDocument<Booking>(collections.bookings, bookingId);
    if (!booking) {
      throw new functions.https.HttpsError('not-found', 'Booking not found');
    }

    if (booking.customerId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
    }

    if (booking.paymentStatus === 'paid') {
      throw new functions.https.HttpsError('failed-precondition', 'Booking already paid');
    }

    if (!booking.finalPrice) {
      throw new functions.https.HttpsError('failed-precondition', 'Final price not set');
    }

    let transactionId: string;
    
    if (paymentMethod === 'wallet') {
      transactionId = await processWalletPayment(booking);
    } else {
      transactionId = await processStripePayment(booking, data.paymentMethodId);
    }

    // Update booking payment status
    await updateDocument<Booking>(collections.bookings, bookingId, {
      paymentStatus: 'paid',
      paymentMethod,
    });

    const response: ApiResponse = {
      success: true,
      data: { transactionId },
      message: 'Payment processed successfully',
    };

    return response;
  } catch (error) {
    console.error('Error processing booking payment:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Process wallet payment
const processWalletPayment = async (booking: Booking): Promise<string> => {
  return runTransaction(async (transaction) => {
    // Get wallet
    const walletQuery = await db
      .collection(collections.wallets)
      .where('userId', '==', booking.customerId)
      .get();

    if (walletQuery.empty) {
      throw new Error('Wallet not found');
    }

    const walletDoc = walletQuery.docs[0];
    const wallet = walletDoc.data() as Wallet;

    if (wallet.balance < booking.finalPrice!) {
      throw new Error('Insufficient wallet balance');
    }

    // Create transaction record
    const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: booking.customerId,
      walletId: wallet.id,
      type: 'payment',
      amount: booking.finalPrice!,
      currency: wallet.currency,
      status: 'completed',
      description: `Payment for booking ${booking.id}`,
      reference: `booking_${booking.id}`,
      bookingId: booking.id,
      paymentMethod: 'wallet',
    };

    const transactionId = uuidv4();
    transaction.set(
      db.collection(collections.transactions).doc(transactionId),
      {
        id: transactionId,
        ...transactionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    // Update wallet balance
    transaction.update(walletDoc.ref, {
      balance: wallet.balance - booking.finalPrice!,
      updatedAt: new Date(),
    });

    return transactionId;
  });
};

// Process Stripe payment
const processStripePayment = async (booking: Booking, paymentMethodId: string): Promise<string> => {
  if (!paymentMethodId) {
    throw new Error('Payment method ID required for Stripe payment');
  }

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(booking.finalPrice! * 100), // Convert to cents
    currency: 'usd',
    payment_method: paymentMethodId,
    confirmation_method: 'manual',
    confirm: true,
  });

  if (paymentIntent.status !== 'succeeded') {
    throw new Error('Payment failed');
  }

  // Create transaction record
  const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
    userId: booking.customerId,
    walletId: '', // No wallet involved for direct Stripe payment
    type: 'payment',
    amount: booking.finalPrice!,
    currency: 'USD',
    status: 'completed',
    description: `Payment for booking ${booking.id}`,
    reference: paymentIntent.id,
    bookingId: booking.id,
    paymentMethod: 'stripe',
    metadata: {
      paymentIntentId: paymentIntent.id,
    },
  };

  const transactionId = uuidv4();
  await createDocument<Transaction>(collections.transactions, transactionId, transactionData);

  return transactionId;
};

// Transfer money to provider after service completion
export const transferToProvider = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth || context.auth.token.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { bookingId } = data;

    if (!bookingId) {
      throw new functions.https.HttpsError('invalid-argument', 'Booking ID required');
    }

    // Get booking
    const booking = await getDocument<Booking>(collections.bookings, bookingId);
    if (!booking) {
      throw new functions.https.HttpsError('not-found', 'Booking not found');
    }

    if (booking.status !== 'completed') {
      throw new functions.https.HttpsError('failed-precondition', 'Booking not completed');
    }

    if (booking.paymentStatus !== 'paid') {
      throw new functions.https.HttpsError('failed-precondition', 'Booking not paid');
    }

    if (!booking.providerId) {
      throw new functions.https.HttpsError('failed-precondition', 'No provider assigned');
    }

    // Get provider wallet
    const providerWallets = await queryDocuments<Wallet>(
      collections.wallets,
      [{ field: 'userId', operator: '==', value: booking.providerId }]
    );

    if (providerWallets.length === 0) {
      throw new functions.https.HttpsError('not-found', 'Provider wallet not found');
    }

    const providerWallet = providerWallets[0];
    const transferAmount = booking.finalPrice! * 0.85; // 85% to provider, 15% platform fee

    // Create transfer transaction
    const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: booking.providerId,
      walletId: providerWallet.id,
      type: 'transfer',
      amount: transferAmount,
      currency: providerWallet.currency,
      status: 'completed',
      description: `Payment for completed booking ${booking.id}`,
      reference: `transfer_${booking.id}`,
      bookingId: booking.id,
    };

    const transactionId = uuidv4();
    await createDocument<Transaction>(collections.transactions, transactionId, transactionData);

    // Update provider wallet balance
    await updateDocument<Wallet>(collections.wallets, providerWallet.id, {
      balance: providerWallet.balance + transferAmount,
    });

    const response: ApiResponse = {
      success: true,
      data: { transactionId, transferAmount },
      message: 'Transfer completed successfully',
    };

    return response;
  } catch (error) {
    console.error('Error transferring to provider:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Withdraw from wallet
export const withdrawFromWallet = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { amount, bankAccount } = data;

    if (!amount || amount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid amount');
    }

    if (!bankAccount) {
      throw new functions.https.HttpsError('invalid-argument', 'Bank account details required');
    }

    // Get user wallet
    const wallets = await queryDocuments<Wallet>(
      collections.wallets,
      [{ field: 'userId', operator: '==', value: context.auth.uid }]
    );

    if (wallets.length === 0) {
      throw new functions.https.HttpsError('not-found', 'Wallet not found');
    }

    const wallet = wallets[0];

    if (wallet.balance < amount) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance');
    }

    // Create withdrawal transaction
    const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: context.auth.uid,
      walletId: wallet.id,
      type: 'withdrawal',
      amount,
      currency: wallet.currency,
      status: 'pending',
      description: 'Wallet withdrawal',
      reference: `withdrawal_${Date.now()}`,
      metadata: { bankAccount },
    };

    const transactionId = uuidv4();
    await createDocument<Transaction>(collections.transactions, transactionId, transactionData);

    // Update wallet balance
    await updateDocument<Wallet>(collections.wallets, wallet.id, {
      balance: wallet.balance - amount,
    });

    const response: ApiResponse = {
      success: true,
      data: { transactionId },
      message: 'Withdrawal request submitted. Processing may take 1-3 business days.',
    };

    return response;
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Get transaction history
export const getTransactionHistory = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { limit = 20, type } = data;

    const queries: any[] = [
      { field: 'userId', operator: '==', value: context.auth.uid },
    ];

    if (type) {
      queries.push({ field: 'type', operator: '==', value: type });
    }

    const transactions = await queryDocuments<Transaction>(
      collections.transactions,
      queries,
      { field: 'createdAt', direction: 'desc' },
      limit
    );

    const response: ApiResponse<Transaction[]> = {
      success: true,
      data: transactions,
    };

    return response;
  } catch (error) {
    console.error('Error getting transaction history:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Webhook for Stripe events
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = functions.config().stripe.webhook_secret;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      res.status(400).send('Webhook signature verification failed');
      return;
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).send('Webhook handler failed');
  }
});

// Handle successful payment intent
const handlePaymentIntentSucceeded = async (paymentIntent: Stripe.PaymentIntent) => {
  try {
    // Find transaction by payment intent ID
    const transactions = await queryDocuments<Transaction>(
      collections.transactions,
      [{ field: 'reference', operator: '==', value: paymentIntent.id }]
    );

    if (transactions.length === 0) {
      console.error('Transaction not found for payment intent:', paymentIntent.id);
      return;
    }

    const transaction = transactions[0];

    // Update transaction status
    await updateDocument<Transaction>(collections.transactions, transaction.id, {
      status: 'completed',
    });

    // If it's a wallet top-up, update wallet balance
    if (transaction.type === 'topup') {
      const wallet = await getDocument<Wallet>(collections.wallets, transaction.walletId);
      if (wallet) {
        await updateDocument<Wallet>(collections.wallets, wallet.id, {
          balance: wallet.balance + transaction.amount,
        });
      }
    }

    console.log(`Payment intent ${paymentIntent.id} processed successfully`);
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
};

// Handle failed payment intent
const handlePaymentIntentFailed = async (paymentIntent: Stripe.PaymentIntent) => {
  try {
    // Find transaction by payment intent ID
    const transactions = await queryDocuments<Transaction>(
      collections.transactions,
      [{ field: 'reference', operator: '==', value: paymentIntent.id }]
    );

    if (transactions.length === 0) {
      console.error('Transaction not found for payment intent:', paymentIntent.id);
      return;
    }

    const transaction = transactions[0];

    // Update transaction status
    await updateDocument<Transaction>(collections.transactions, transaction.id, {
      status: 'failed',
    });

    console.log(`Payment intent ${paymentIntent.id} failed`);
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
};