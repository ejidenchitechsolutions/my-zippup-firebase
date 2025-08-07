import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  Divider,
  Paper,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CreditCard as CreditCardIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { WalletTopUp } from '../components/WalletTopUp';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  method?: string;
}

export const WalletPage: React.FC = () => {
  const [balance, setBalance] = useState(125.50);
  const [topUpOpen, setTopUpOpen] = useState(false);

  // Mock transaction data
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'credit',
      amount: 50.00,
      description: 'Wallet Top-up via Stripe',
      date: '2024-01-15T10:30:00Z',
      status: 'completed',
      method: 'Credit Card',
    },
    {
      id: '2',
      type: 'debit',
      amount: 25.00,
      description: 'Plumbing Service Payment',
      date: '2024-01-14T14:20:00Z',
      status: 'completed',
    },
    {
      id: '3',
      type: 'credit',
      amount: 100.00,
      description: 'Wallet Top-up via Stripe',
      date: '2024-01-12T09:15:00Z',
      status: 'completed',
      method: 'Debit Card',
    },
    {
      id: '4',
      type: 'debit',
      amount: 15.00,
      description: 'Emergency Service Fee',
      date: '2024-01-10T16:45:00Z',
      status: 'completed',
    },
    {
      id: '5',
      type: 'credit',
      amount: 75.00,
      description: 'Provider Payout',
      date: '2024-01-08T11:30:00Z',
      status: 'completed',
    },
  ]);

  const handleTopUpSuccess = (amount: number) => {
    setBalance(prev => prev + amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.type === 'credit') {
      return <TrendingUpIcon color="success" />;
    } else {
      return <TrendingDownIcon color="error" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  // Calculate monthly stats
  const monthlyCredit = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const monthlyDebit = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <>
      <Helmet>
        <title>Wallet - ZippUp</title>
        <meta name="description" content="Manage your ZippUp wallet, view transactions, and top up your balance" />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
            My Wallet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your balance, view transactions, and top up your wallet
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Balance Card */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
                  color: 'white',
                  mb: 3,
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Grid container alignItems="center" spacing={3}>
                    <Grid item>
                      <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 64, height: 64 }}>
                        <WalletIcon sx={{ fontSize: 32 }} />
                      </Avatar>
                    </Grid>
                    <Grid item xs>
                      <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                        Available Balance
                      </Typography>
                      <Typography variant="h2" fontWeight="bold">
                        ${balance.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                        Last updated: {new Date().toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => setTopUpOpen(true)}
                          sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                          }}
                        >
                          Top Up
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<RemoveIcon />}
                          sx={{
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                            color: 'white',
                            '&:hover': {
                              borderColor: 'white',
                              bgcolor: 'rgba(255, 255, 255, 0.1)',
                            },
                          }}
                        >
                          Withdraw
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>

            {/* Monthly Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <TrendingUpIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    +${monthlyCredit.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Money In (This Month)
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <TrendingDownIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h5" fontWeight="bold" color="error.main">
                    -${monthlyDebit.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Money Out (This Month)
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <List>
                  <ListItem button onClick={() => setTopUpOpen(true)}>
                    <ListItemIcon>
                      <CreditCardIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Add Money"
                      secondary="Top up via Stripe"
                    />
                  </ListItem>
                  <ListItem button>
                    <ListItemIcon>
                      <RemoveIcon color="error" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Withdraw Funds"
                      secondary="Transfer to bank"
                    />
                  </ListItem>
                  <ListItem button>
                    <ListItemIcon>
                      <ReceiptIcon color="info" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Download Statement"
                      secondary="Get transaction history"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Methods
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <CreditCardIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body1">Stripe Integration</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Secure card payments
                    </Typography>
                  </Box>
                </Box>
                <Button variant="outlined" size="small" fullWidth>
                  Manage Cards
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Transaction History */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <HistoryIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Recent Transactions
                  </Typography>
                </Box>
                
                <List>
                  {transactions.map((transaction, index) => (
                    <React.Fragment key={transaction.id}>
                      <ListItem>
                        <ListItemIcon>
                          {getTransactionIcon(transaction)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="body1">
                                {transaction.description}
                              </Typography>
                              <Chip 
                                label={transaction.status}
                                size="small"
                                color={getStatusColor(transaction.status) as any}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(transaction.date)}
                              </Typography>
                              {transaction.method && (
                                <Typography variant="caption" color="text.secondary">
                                  via {transaction.method}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <Typography
                          variant="h6"
                          color={transaction.type === 'credit' ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </Typography>
                      </ListItem>
                      {index < transactions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button variant="outlined">
                    View All Transactions
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Wallet Top-up Dialog */}
        <WalletTopUp
          open={topUpOpen}
          onClose={() => setTopUpOpen(false)}
          currentBalance={balance}
          onTopUpSuccess={handleTopUpSuccess}
        />
      </Container>
    </>
  );
};