const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const auth = require('../middleware/auth')
const user = require('../models/userModel')
// register
router.post('/register', async (req, res) => {
  try {
    let { email, password, passwordCheck, displayName } = req.body

    // validate

    if (!email || !password || !passwordCheck)
      return res.status(400).json({ msg: 'Not all fields have been entered.' })
    if (password.length < 5)
      return res
        .status(400)
        .json({ msg: 'Password needs to be at least 5 characters long.' })
    if (password !== passwordCheck)
      return res
        .status(400)
        .json({ msg: 'Enter the same password twice for verification.' })

    const existingUser = await User.findOne({ email })
    if (existingUser)
      return res
        .status(400)
        .json({ msg: 'An account with this email already exists.' })
    if (!displayName) displayName = email

    // hash password

    const salt = await bcrypt.genSalt()
    const passwordHash = await bcrypt.hash(password, salt)

    // register user
    const newUser = new User({ email, password: passwordHash, displayName })
    const savedUser = await newUser.save()

    // send user details to front end
    res.status(201).json({
      id: savedUser._id,
      email: savedUser.email,
      displayName: savedUser.displayName,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // validate
    if (!email || !password)
      return res.status(400).json({ msg: 'Not all fields have been entered.' })
    const user = await User.findOne({ email })
    if (!user)
      return res
        .status(400)
        .json({ msg: 'No account with that email has been registered.' })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials.' })

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
    res.status(202).json({
      token,
      user: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// tokenIsValid
router.post('/verify', async (req, res) => {
  try {
    // verify token
    const token = req.header('x-auth-token')
    if (!token) return res.json(false)
    const verified = jwt.verify(token, process.env.JWT_SECRET)
    if (!verified) return res.json(false)

    // verify user exists
    const user = await User.findById(verified.id)
    if (!user) return res.json(false)

    // valid
    return res.json(true)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// delete
router.delete('/delete', auth, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user)
    if (!deletedUser)
      return res
        .status(400)
        .json({ msg: 'No account with that email is registered.' })
    // send details to front end
    res.status(201).json(deletedUser)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
