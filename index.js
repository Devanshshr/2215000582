const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 9876;
const WINDOW_SIZE = 10;
const REQUEST_TIMEOUT = 500;
const TEST_SERVER_BASE_URL = 'http://20.244.56.144/evaluation-service';
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ0OTU2OTY2LCJpYXQiOjE3NDQ5NTY2NjYsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjVjNWI0MDNlLWZkMzgtNDJiZC1hMjVkLWRiZjhkZjY2NDdmNCIsInN1YiI6ImRldmFuc2guc2hhcm1hMV9jczIyQGdsYS5hYy5pbiJ9LCJlbWFpbCI6ImRldmFuc2guc2hhcm1hMV9jczIyQGdsYS5hYy5pbiIsIm5hbWUiOiJkZXZhbnNoIHNoYXJtYSIsInJvbGxObyI6IjIyMTUwMDA1ODIiLCJhY2Nlc3NDb2RlIjoiQ05uZUdUIiwiY2xpZW50SUQiOiI1YzViNDAzZS1mZDM4LTQyYmQtYTI1ZC1kYmY4ZGY2NjQ3ZjQiLCJjbGllbnRTZWNyZXQiOiJXR2RkdWVBTWJXckV0V3d1In0.Wq-3MylizKeDiFfLvJcLK-Rf1DhgW8lIhD9_VhyCSuk";

class NumbersStore {
  constructor(windowSize) {
    this.windowSize = windowSize;
    this.numbers = [];
  }

  addNumber(number) {
    if (!this.numbers.includes(number)) {
      if (this.numbers.length >= this.windowSize) {
        this.numbers.shift();
      }
      this.numbers.push(number);
    }
  }

  addNumbers(newNumbers) {
    newNumbers.forEach(number => this.addNumber(number));
  }

  getNumbers() {
    return [...this.numbers];
  }

  getAverage() {
    if (this.numbers.length === 0) return 0;
    const sum = this.numbers.reduce((total, num) => total + num, 0);
    return parseFloat((sum / this.numbers.length).toFixed(2));
  }
}

const stores = {
  'p': new NumbersStore(WINDOW_SIZE),
  'f': new NumbersStore(WINDOW_SIZE),
  'e': new NumbersStore(WINDOW_SIZE),
  'r': new NumbersStore(WINDOW_SIZE)
};

async function fetchNumbers(type) {
  const endpoints = {
    'p': `${TEST_SERVER_BASE_URL}/primes`,
    'f': `${TEST_SERVER_BASE_URL}/fibo`,
    'e': `${TEST_SERVER_BASE_URL}/even`,
    'r': `${TEST_SERVER_BASE_URL}/rand`
  };

  try {
    const response = await axios.get(endpoints[type], {
      timeout: REQUEST_TIMEOUT,
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`
      }
    });

    return response.data.numbers || [];
  } catch (error) {
    console.error(`Error fetching ${type} numbers:`, error.response?.data || error.message);
    return [];
  }
}

app.get('/numbers/:type', async (req, res) => {
  const { type } = req.params;

  if (!['p', 'f', 'e', 'r'].includes(type)) {
    return res.status(400).json({ error: 'Invalid number type. Use p, f, e, or r.' });
  }

  const store = stores[type];
  const windowPrevState = store.getNumbers();
  const fetchedNumbers = await fetchNumbers(type);
  store.addNumbers(fetchedNumbers);

  const response = {
    windowPrevState,
    windowCurrState: store.getNumbers(),
    numbers: fetchedNumbers,
    avg: store.getAverage()
  };

  res.json(response);
});

app.listen(PORT, () => {
  console.log(`Average Calculator service running on port ${PORT}`);
});
