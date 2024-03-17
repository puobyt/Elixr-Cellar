const express = require('express')
const app = express()
const session = require('express-session')
const path = require('path')
const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute')
const config = require('./Config/config')
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY)


require('./Model/databaseModel')
require('./Model/userModel')
require('./Model/adminModel')
require('dotenv').config();


app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,

}))



app.use(express.json())
app.use(express.urlencoded({ extended: true }))


const port = process.env.PORT



app.set('view engine', 'ejs')



app.use('/public', express.static('public'));



const staticPath = path.join(__dirname, 'public');
app.use(express.static(staticPath));

app.use(userRoute)
app.use(adminRoute)


app.listen(port, () => console.log(`Server is running at  http://localhost:${port}`))