import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'data-service' });
});

app.get('/api/data/strategies', (req, res) => {
  res.json([
    { id: 1, name: 'Growth Strategy', type: 'growth' },
    { id: 2, name: 'Risk Management', type: 'risk' }
  ]);
});

app.listen(PORT, () => {
  console.log(`Data service running on port ${PORT}`);
});
