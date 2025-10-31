const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const app = express();
app.use(cors());
app.use(bodyParser.json({limit:'5mb'}));
app.use(morgan('dev'));

const DATA_FILE = path.join(__dirname, 'data', 'bills.json');

function readData(){
  try {
    if(!fs.existsSync(DATA_FILE)){
      fs.writeFileSync(DATA_FILE, JSON.stringify([]));
    }
    const raw = fs.readFileSync(DATA_FILE);
    return JSON.parse(raw);
  } catch(e){
    console.error('readData error', e);
    return [];
  }
}

function writeData(arr){
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2));
    return true;
  } catch(e){ console.error('writeData error', e); return false; }
}

app.post('/api/bills', (req, res) => {
  const { customer, items, computed } = req.body;
  const arr = readData();
  const id = (arr.length? arr[arr.length-1].id + 1 : 1);
  const rec = { id, created_at: new Date().toISOString(), customer, items, computed };
  arr.push(rec);
  writeData(arr);
  res.json({ ok:true, id });
});

app.get('/api/bills', (req, res) => {
  const arr = readData();
  // return last 200
  res.json(arr.slice(-200).reverse());
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log('Server running on', PORT));
