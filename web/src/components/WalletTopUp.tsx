import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import { CreditCard as CreditCardIcon } from '@mui/icons-material';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe, mockPayment } from '../services/stripe';
import toast from 'react-hot-toast';

interface WalletTopUpProps {
  open: boolean;
  onClose: () => void;
  currentBalance: number;
  onTopUpSuccess: (amount: number) => void;
}

const CardForm: React.FC<{
  amount: number;
  onSuccess: (amount: number) => void;
  onClose: () => void;
}> = ({ amount, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      // For demo purposes, we'll use mock payment
      // In production, this would create a real payment intent
      const result = await mockPayment(amount);
      
      if (result.status === 'succeeded') {
        toast.success(`Successfully added $${amount} to your wallet!`);
        onSuccess(amount);
        onClose();
      } else {
        throw new Error('Payment failed');
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Card Information
        </Typography>
        <Box
          sx={{
            p: 2,
            border: '1px solid',
            borderColor: 'grey.300',
            borderRadius: 1,
            '& .StripeElement': {
              height: '20px',
              padding: '10px 12px',
              color: '#424770',
              backgroundColor: 'transparent',
              fontSize: '16px',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
          }}
        >
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onClose} disabled={processing}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || processing}
          startIcon={processing ? <CircularProgress size={16} /> : <CreditCardIcon />}
        >
          {processing ? 'Processing...' : `Pay $${amount}`}
        </Button>
      </Box>
    </form>
  );
};

export const WalletTopUp: React.FC<WalletTopUpProps> = ({
  open,
  onClose,
  currentBalance,
  onTopUpSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [step, setStep] = useState<'amount' | 'payment'>('amount');

  const quickAmounts = [10, 25, 50, 100, 200];

  const handleAmountSubmit = () => {
    const numAmount = parseFloat(amount);
    if (numAmount >= 5 && numAmount <= 1000) {
      setStep('payment');
    }
  };

  const handleClose = () => {
    setAmount('');
    setStep('amount');
    onClose();
  };

  const handleTopUpSuccess = (topUpAmount: number) => {
    onTopUpSuccess(topUpAmount);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Top Up Wallet
        <Typography variant="body2" color="text.secondary">
          Current Balance: ${currentBalance.toFixed(2)}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {step === 'amount' ? (
          <Box>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              helperText="Minimum $5, Maximum $1000"
              sx={{ mb: 3 }}
            />

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Quick Amounts
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant={amount === quickAmount.toString() ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setAmount(quickAmount.toString())}
                >
                  ${quickAmount}
                </Button>
              ))}
            </Box>

            <Alert severity="info">
              💳 Demo Mode: Use test card 4242 4242 4242 4242 with any future date and CVC
            </Alert>
          </Box>
        ) : (
          <Elements stripe={getStripe()}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Add ${amount} to Wallet
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                New Balance: ${(currentBalance + parseFloat(amount)).toFixed(2)}
              </Typography>

              <CardForm
                amount={parseFloat(amount)}
                onSuccess={handleTopUpSuccess}
                onClose={handleClose}
              />
            </Box>
          </Elements>
        )}
      </DialogContent>

      {step === 'amount' && (
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAmountSubmit}
            disabled={!amount || parseFloat(amount) < 5 || parseFloat(amount) > 1000}
          >
            Continue to Payment
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};