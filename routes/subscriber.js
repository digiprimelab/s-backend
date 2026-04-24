const express = require('express')
const Subscriber = require('../models/Subscriber')
const { route } = require('./fees')
const auth = require('../middleware/auth')

const router = express.Router()

router.post('/create-subcriber', async (req,res)=>{
    try {
        const {email} = req.body

        if(!email){
            return res.status(400).json({message:"Email is required"})
        }



     


        // check mail

        const existsMail = await Subscriber.findOne({email})
        if(existsMail){
            return res.status(400).json({message:"Already subscribed"})
        }
        const subscribe = new Subscriber({email})
        await subscribe.save()

        res.status(201).json({message:"Subscribed successfully"})
        
    } catch (error) {
        res.status(500).json({message:error.message})
        
    }

})

// get all subscriber


router.get('/all-subscriber', async (req, res)=>{
    try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})

module.exports = router