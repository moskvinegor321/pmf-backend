const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors({
  origin: 'https://superfluous-let-625859.framer.app',
  credentials: true
}));
app.use(express.json());

mongoose.set('serverSelectionTimeoutMS', 60000);

// Подключение к MongoDB
mongoose.connect('mongodb+srv://moskvinegor:OymxtIDohGeOfuwX@cluster0.tq3xlaw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 60000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 60000
}).then(() => {
  console.log('MongoDB connected successfully');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});


// Модель гипотезы
const Hypothesis = mongoose.model('Hypothesis', {
  uniqueID: String,
  hypothesisName: String,
  problemStatement: String,
  businessAlignment: String,
  productStage: String,
  targetSegment: String,
  expectedOutcome: String,
  evidenceBase: String,
  hypothesisType: Array,
  problemToSolve: String,
  methodologyType: Array,
  testDescription: String,
  duration: String,
  primaryMetric: String,
  secondaryMetrics: String,
  targetValue: String,
  responsiblePerson: String,
  startDate: String,
  endDate: String,
  resources: String,
  midwayResults: String,
  adjustments: String,
  actualOutcome: String,
  conclusion: String,
  decision: String,
  implementationPlan: String,
  followUpHypotheses: String,
  lessonsLearned: String,
  status: String,
  attachments: String,
  version: String,
  lastUpdated: String,
  userId: String,
});

// Модель пользователя
const User = mongoose.model('User', {
  username: String,
  password: String,
});

// Секретный ключ для JWT
const JWT_SECRET = 'your_jwt_secret_key';

// Регистрация нового пользователя
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send({ message: 'Пользователь создан' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Аутентификация пользователя
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) return res.status(400).send({ error: 'Пользователь не найден' });
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).send({ error: 'Неверный пароль' });
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
    res.send({ token });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Middleware для проверки токена
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).send({ error: 'Требуется аутентификация' });
  
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.userId = verified.id;
    next();
  } catch (error) {
    res.status(400).send({ error: 'Недействительный токен' });
  }
};

// Получение всех гипотез
app.get('/api/hypotheses', auth, async (req, res) => {
  const hypotheses = await Hypothesis.find({ userId: req.userId });
  res.send(hypotheses);
});

// Получение гипотезы по ID
app.get('/api/hypotheses/:id', auth, async (req, res) => {
  try {
    const hypothesis = await Hypothesis.findOne({ 
      uniqueID: req.params.id,
      userId: req.userId 
    });
    
    if (!hypothesis) {
      return res.status(404).send({ error: 'Гипотеза не найдена' });
    }
    
    res.send(hypothesis);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Создание новой гипотезы
app.post('/api/hypotheses', auth, async (req, res) => {
  try {
    const hypothesis = new Hypothesis({
      ...req.body,
      userId: req.userId
    });
    await hypothesis.save();
    res.status(201).send(hypothesis);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Обновление гипотезы
app.put('/api/hypotheses/:id', auth, async (req, res) => {
  try {
    const hypothesis = await Hypothesis.findOneAndUpdate(
      { uniqueID: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    
    if (!hypothesis) {
      return res.status(404).send({ error: 'Гипотеза не найдена' });
    }
    
    res.send(hypothesis);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Удаление гипотезы
app.delete('/api/hypotheses/:id', auth, async (req, res) => {
  try {
    const hypothesis = await Hypothesis.findOneAndDelete({
      uniqueID: req.params.id,
      userId: req.userId
    });
    
    if (!hypothesis) {
      return res.status(404).send({ error: 'Гипотеза не найдена' });
    }
    
    res.send({ message: 'Гипотеза удалена' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

// Для Vercel
module.exports = app;
