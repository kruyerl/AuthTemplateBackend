const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
require('dotenv').config()

// set up express

const app = express()
app.use(express.json())
app.use(cors())

const PORT = process.env.PORT || 5000

app.listen(PORT, () => console.log(`The server has started on port: ${PORT}`))

// set up mongoose

mongoose.connect(
    process.env.MONGO_DB, 
{
        useNewUrlParser: true, 
        useUnifiedTopology: true, 
        useCreateIndex: true
    }, (err) => {
    if (err) throw err
    console.log(`MongoDb connection established`)
    });

// set up routes

app.use('/api/users', require('./routes/userRouter'))
