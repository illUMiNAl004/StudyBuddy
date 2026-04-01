import 'dotenv/config'
import express from 'express'
import { createClient } from '@supabase/supabase-js'
import cors from 'cors'
import {
  createAuthUserForProfile,
  createProfile,
  findProfileByEmail,
  validateLoginPayload,
} from './helpers/profileAuth.js'

const app = express()
app.use(cors())
app.use(express.json())

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

app.get('/all-profiles', async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Login/signup endpoint restricted to UMass emails.
app.post('/login', async (req, res) => {
  const validation = validateLoginPayload(req.body)
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error })
  }

  const payload = validation.data

  const existing = await findProfileByEmail(supabase, payload.email)
  if (existing.error) {
    return res.status(500).json({ error: existing.error.message })
  }

  if (existing.data) {
    return res.json({ user: existing.data, isNewUser: false })
  }

  const authUserResult = await createAuthUserForProfile(
    supabase,
    payload.email,
    payload.full_name,
  )

  const authUser = authUserResult?.data?.user
  if (authUserResult.error || !authUser?.id) {
    const message = authUserResult.error?.message ?? 'Could not create auth user.'
    return res.status(500).json({ error: message })
  }

  const inserted = await createProfile(supabase, payload, authUser.id)
  if (inserted.error) {
    // Best-effort cleanup if profile insert fails after auth user creation.
    await supabase.auth.admin.deleteUser(authUser.id)
    const status = inserted.error.code === '23505' ? 409 : 500
    return res.status(status).json({ error: inserted.error.message })
  }

  return res.status(201).json({ user: inserted.data, isNewUser: true })
})

app.listen(3000, () => console.log('Backend running on port 3000'))
