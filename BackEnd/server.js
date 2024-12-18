const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');


const app = express();
const port = 5000;


app.use(bodyParser.json());
app.use(cors());


mongoose.connect('mongodb://localhost:27017/quickbank', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('Error connecting to MongoDB: ', err));


const userSchema = new mongoose.Schema({
  accountNumber: { type: String, required: true, unique: true },
  accountHolderName: { type: String, required: true },
  pin: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  accountBalance: { type: Number, default: 10000 }, 
});


const User = mongoose.model('User', userSchema);


app.post('/api/signup', async (req, res) => {
  const { accountNumber, accountHolderName, pin, phoneNumber } = req.body;

  
  const newUser = new User({
    accountNumber,
    accountHolderName,
    pin,
    phoneNumber,
  });

  try {
    await newUser.save(); 
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
});


app.post('/api/login', async (req, res) => {
  const { accountNumber, pin } = req.body;

  try {
   
    const user = await User.findOne({ accountNumber, pin });
    if (user) {
      
      res.status(200).json({
        message: 'Login successful',
        user: {
          accountNumber: user.accountNumber,
          name: user.accountHolderName,
          phoneNumber: user.phoneNumber,
          balance: user.accountBalance,
        },
      });
    } else {
    
      res.status(401).json({ message: 'Invalid account number or PIN' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error during login', error });
  }
});


app.post('/api/accountDetails', async (req, res) => {
  const { accountNumber } = req.body;

  try {
    
    const user = await User.findOne({ accountNumber });

    if (user) {
      
      const userDetails = {
        accountNumber: user.accountNumber,
        accountHolderName: user.accountHolderName,
        accountBalance: user.accountBalance,
      };

      res.status(200).json(userDetails);
    } else {
      res.status(404).json({ message: 'Account not found' });
    }
  } catch (error) {
    console.error('Error fetching account details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/api/withdraw', async (req, res) => {
  const { accountNumber, amount } = req.body;

  try {
    
    const user = await User.findOne({ accountNumber });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    
    if (user.accountBalance >= amount) {
      user.accountBalance -= amount; 
      await user.save(); 
      return res.json({ updatedBalance: user.accountBalance });
    } else {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
