import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

export const getStripe = async (): Promise<Stripe | null> => {
  return await stripePromise;
};

// Payment Intent creation (calls your Firebase function)
export const createPaymentIntent = async (amount: number, currency: string = 'usd') => {
  try {
    // This would call your Firebase function to create a payment intent
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to cents
        currency,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    const { client_secret } = await response.json();
    return client_secret;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Process wallet top-up
export const processWalletTopUp = async (amount: number) => {
  try {
    const stripe = await getStripe();
    if (!stripe) throw new Error('Stripe not loaded');

    // Create payment intent
    const clientSecret = await createPaymentIntent(amount);

    // Confirm payment
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: {
          // This would be replaced with actual card element
          number: '4242424242424242',
          exp_month: 12,
          exp_year: 2025,
          cvc: '123',
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return paymentIntent;
  } catch (error) {
    console.error('Error processing wallet top-up:', error);
    throw error;
  }
};

// Mock payment for demo purposes
export const mockPayment = async (amount: number) => {
  // Simulate payment processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    id: `pi_mock_${Date.now()}`,
    amount: amount * 100,
    currency: 'usd',
    status: 'succeeded',
    created: Math.floor(Date.now() / 1000),
  };
};

export default stripePromise;