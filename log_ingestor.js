// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
// Create an Express application
const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb+srv://advaitaa:hello@cluster0.qmwmiqh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define a basic GET route
app.get('/', (req, res) => {
  res.send('Backend is connected and running!');
});

const logSchema = new mongoose.Schema({
  level: String,
  message: String,
  resourceId: String,
  timestamp: Date,
  traceId: String,
  spanId: String,
  commit: String,
  metadata: {
    parentResourceId: String,
  },
});


logSchema.index(
  {
    level: 'text',
    message: 'text',
    resourceId: 'text',
    timestamp: 'text',
    'metadata.parentResourceId': 'text',
  },
  {
    name: 'log_text_index',
    default_language: 'english',
  }
);

const Log = mongoose.model('Log', logSchema);

app.use(bodyParser.json());
app.use(cors());

app.post('/log', async (req, res) => {
  const logData = req.body;

  if (!logData) {
    return res.status(400).json({ error: 'Invalid log format' });
  }

  try {
    const newLog = new Log(logData);
    await newLog.save();
    res.status(200).json({ message: 'Log entry received and ingested successfully' });
  } catch (error) {
    console.error(`Error ingesting log to MongoDB: ${error}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/query', async (req, res) => {
  try {
    const filters = req.body.filters;
    const filterObject = {};

    for (const filterField in filters) {
      if (filters.hasOwnProperty(filterField)) {
        filterObject[filterField] = filters[filterField];
      }
    }

    if (Object.keys(filterObject).length === 0) {
    
      console.log(filterObject);

      const result = await Log.find();
      console.log('Query Result:', result);
      res.json(result);
    } else {
     
      console.log(filterObject);
      const result = await Log.find(filterObject);
      console.log('Query Result:', result);
      res.json(result);
    }
  } catch (error) {
    console.error('Error querying logs:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
