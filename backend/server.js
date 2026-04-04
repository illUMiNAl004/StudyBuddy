import 'dotenv/config'
import express from 'express'
import { createClient } from '@supabase/supabase-js'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import {
  createProfile,
  findProfileByEmail,
  validateSignupPayload,
  validateLoginPayload
} from './helpers/profileAuth.js'

const app = express()
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  console.error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY in backend/.env')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
const supabaseAnon = createClient(supabaseUrl, anonKey)

// Middleware to protect routes and verify the session
const requireAuth = async (req, res, next) => {
  const token = req.cookies.access_token
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' })
  }

  const { data: { user }, error } = await supabaseAnon.auth.getUser(token)
  
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' })
  }

  req.user = user
  next()
}

app.get('/all-profiles', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('profiles').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/api/auth/signup', async (req, res) => {
  const validation = validateSignupPayload(req.body)
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error })
  }

  const payload = validation.data

  const existing = await findProfileByEmail(supabaseAdmin, payload.email)
  if (existing.error) {
    return res.status(500).json({ error: existing.error.message })
  }

  if (existing.data) {
    return res.status(409).json({ error: 'User with this email already exists.' })
  }

  const { data, error } = await supabaseAnon.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: { full_name: payload.full_name }
    }
  })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  if (data.user) {
    const inserted = await createProfile(supabaseAdmin, payload, data.user.id)
    if (inserted.error) {
      console.error('Failed to create profile for user', inserted.error)
      // They are signed up but profile not fully complete
    }
  }

  return res.status(201).json({ 
    message: 'Signup successful! Please check your email to verify your account.',
    user: data.user
  })
})

app.post('/api/auth/login', async (req, res) => {
  const validation = validateLoginPayload(req.body)
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error })
  }

  const payload = validation.data

  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  })

  if (error) {
    return res.status(401).json({ error: error.message })
  }

  const { session } = data
  
  res.cookie('access_token', session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: session.expires_in * 1000
  })

  res.cookie('refresh_token', session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000
  })

  return res.json({ message: 'Login successful', user: data.user })
})

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = req.user
  const is_verified = !!user.email_confirmed_at
  
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  res.json({
    id: user.id,
    email: user.email,
    is_verified,
    full_name: user.user_metadata?.full_name || null,
    last_sign_in_at: user.last_sign_in_at,
    profile
  })
})

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  const token = req.cookies.access_token
  
  if (token) {
    await supabaseAnon.auth.admin.signOut(token).catch(console.error)
  }
  
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })
  
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })

  res.json({ message: 'Logged out successfully' })
})

app.listen(3000, () => console.log('Backend running on port 3000'))
