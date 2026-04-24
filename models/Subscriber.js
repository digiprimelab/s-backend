const mongoose = require('mongoose')

const SubscriberSchama = new mongoose.Schema({
    email:{
        type:String,
        unique:true,
        require: true,
        trim:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    }

})

module.exports = mongoose.model("subscribe",SubscriberSchama)
