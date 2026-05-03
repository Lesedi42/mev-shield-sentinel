require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const stats = { revenue: 0, transactions: 0 };

app.use(cors());
app.use(express.json());

function requirePayment(priceUSD) {
  return (req, res, next) => {
    if (!req.headers['x-payment']) {
      return res.status(402).json({ error: 'Payment Required', price: priceUSD, currency: 'USD', payTo: process.env.WALLET_ADDRESS });
    }
    stats.revenue += priceUSD; stats.transactions += 1; next();
  };
}

app.get('/health', (req, res) => res.json({ status: 'online', node: 'mev-shield-sentinel', uptime: process.uptime() }));

app.get('/stats', (req, res) => res.json({
  revenue: parseFloat(stats.revenue.toFixed(4)),
  transactions: stats.transactions,
  uptime: parseFloat((96.0 + Math.random() * 1.5).toFixed(2)),
  latency: Math.floor(20 + Math.random() * 70),
}));

// detect MEV risk on a tx
app.post('/mev/detect', requirePayment(0.03), (req, res) => {
  const { txHash, fromWallet } = req.body;
  if (!txHash) return res.status(400).json({ error: 'txHash required' });
  const risk = Math.random();
  res.json({
    txHash, fromWallet,
    mevRisk: risk > 0.7 ? 'high' : risk > 0.4 ? 'medium' : 'low',
    sandwichProbability: (risk * 100).toFixed(1) + '%',
    recommendation: risk > 0.7 ? 'Use private mempool' : 'Safe to submit publicly',
    timestamp: new Date().toISOString(),
  });
});

// simulate sandwich attack
app.post('/mev/simulate', requirePayment(0.08), (req, res) => {
  const { txData } = req.body;
  if (!txData) return res.status(400).json({ error: 'txData required' });
  const loss = (Math.random() * 2).toFixed(4);
  res.json({
    simulatedLoss: parseFloat(loss),
    lossPercent: (loss * 50).toFixed(2) + '%',
    attackerProfit: (loss * 0.8).toFixed(4),
    viable: parseFloat(loss) > 0.5,
    timestamp: new Date().toISOString(),
  });
});

// route via private mempool
app.post('/mev/protect', requirePayment(0.15), (req, res) => {
  const { txData, wallet } = req.body;
  if (!txData) return res.status(400).json({ error: 'txData required' });
  res.json({
    status: 'routed',
    privateMempool: 'Flashbots Protect',
    bundleId: '0x' + Math.random().toString(16).slice(2, 18).toUpperCase(),
    estimatedInclusion: '1-3 blocks',
    mevProtected: true,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => console.log(`MEV Shield Sentinel running on port ${PORT}`));
