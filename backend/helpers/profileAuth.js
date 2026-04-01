import crypto from 'node:crypto'

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

export function isUmassEmail(email) {
  return /^[^\s@]+@umass\.edu$/i.test(normalizeEmail(email))
}

export function validateLoginPayload(payload) {
  const email = normalizeEmail(payload?.email)
  const fullName = String(payload?.full_name ?? '').trim()
  const classYear = String(payload?.class_year ?? '').trim()
  const major = String(payload?.major ?? '').trim()

  if (!email || !fullName || !classYear || !major) {
    return { ok: false, error: 'All fields are required.' }
  }

  if (!isUmassEmail(email)) {
    return { ok: false, error: 'Only @umass.edu emails are allowed.' }
  }

  return {
    ok: true,
    data: { email, full_name: fullName, class_year: classYear, major },
  }
}

export async function findProfileByEmail(supabase, email) {
  return supabase
    .from('profiles')
    .select('id, email, full_name, class_year, major, created_at, updated_at')
    .eq('email', email)
    .maybeSingle()
}

export async function createAuthUserForProfile(supabase, email, fullName) {
  const randomPassword = crypto.randomBytes(18).toString('base64url')
  return supabase.auth.admin.createUser({
    email,
    password: randomPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
}

export async function createProfile(supabase, payload, userId) {
  const now = new Date().toISOString()
  return supabase
    .from('profiles')
    .insert({
      id: userId,
      email: payload.email,
      full_name: payload.full_name,
      class_year: payload.class_year,
      major: payload.major,
      created_at: now,
      updated_at: now,
    })
    .select('id, email, full_name, class_year, major, created_at, updated_at')
    .single()
}
