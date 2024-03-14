const mongoose = require('mongoose')
require('dotenv').config();



mongoose.connect(process.env.mongoDb).then(() => {

    console.log('Database running succesfully')

}).catch((err) => {

    console.log(err)

})



