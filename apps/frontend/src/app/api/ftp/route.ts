import { NextResponse } from 'next/server'

// Disable edge runtime - we need Node APIs (net, tls)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { Writable } from 'stream'

type Credentials = {
  host: string
  port?: number
  username: string
  password: string
  path?: string
  protocol?: 'ftp' | 'sftp'
}

type OutFile = { name: string; content: string }

// Lazy import heavy deps to reduce cold start cost
async function fetchViaFtp(creds: Required<Pick<Credentials, 'host' | 'port' | 'username' | 'password'>> & { path: string }): Promise<OutFile[]> {
  const ftp = await import('basic-ftp')
  const client = new ftp.Client(15000)
  client.ftp.verbose = false
  const files: OutFile[] = []
  try {
    const downloadToBuffer = async (remotePath: string) => {
      const chunks: Buffer[] = []
      const writable = new Writable({
        write(chunk, _enc, cb) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
          cb()
        },
      })
      await client.downloadTo(writable as any, remotePath)
      return Buffer.concat(chunks)
    }
    await client.access({
      host: creds.host,
      port: creds.port,
      user: creds.username,
      password: creds.password,
      secure: false,
    })
    async function walk(dir: string) {
      const list = await client.list(dir)
      for (const item of list) {
        const fullPath = dir.endsWith('/') ? dir + item.name : dir + '/' + item.name
        if (item.isDirectory) {
          await walk(fullPath)
        } else {
          const lower = item.name.toLowerCase()
          if (!(/\.(html?|css|js)$/i.test(lower))) continue
          try {
            const buf = await downloadToBuffer(fullPath)
            const content = buf.toString('utf-8')
            files.push({ name: fullPath.replace(/^\/+/, ''), content })
          } catch {
            // Skip files that cannot be fetched (e.g., broken symlink, permissions)
            continue
          }
        }
      }
    }
    await walk(creds.path || '/')
  } finally {
    client.close()
  }
  return files
}

async function fetchViaSftp(creds: Required<Pick<Credentials, 'host' | 'port' | 'username' | 'password'>> & { path: string }): Promise<OutFile[]> {
  const SFTP = (await import('ssh2-sftp-client')).default
  const sftp = new SFTP()
  const files: OutFile[] = []
  try {
    await sftp.connect({
      host: creds.host,
      port: creds.port,
      username: creds.username,
      password: creds.password,
      readyTimeout: 15000,
    })
    async function walk(dir: string) {
      const list = await sftp.list(dir)
      for (const item of list) {
        const fullPath = dir.endsWith('/') ? dir + item.name : dir + '/' + item.name
        if (item.type === 'd') {
          await walk(fullPath)
        } else {
          const lower = item.name.toLowerCase()
          if (!(/\.(html?|css|js)$/i.test(lower))) continue
          // Only process regular files ('-'); skip symlinks ('l') to avoid broken targets
          if (item.type !== '-') continue
          try {
            const buf = await sftp.get(fullPath) as Buffer
            const content = buf.toString('utf-8')
            files.push({ name: fullPath.replace(/^\/+/, ''), content })
          } catch {
            // Skip files that cannot be fetched (e.g., not found, permission issues)
            continue
          }
        }
      }
    }
    await walk(creds.path || '/')
  } finally {
    try { await sftp.end() } catch {}
  }
  return files
}

export async function POST(req: Request) {
  try {
    console.log('[API][FTP] Incoming POST /api/ftp')
    const body = await req.json() as Credentials
    const host = (body.host || '').trim()
    if (!host) return NextResponse.json({ error: 'host is required' }, { status: 400 })
    const username = body.username || ''
    const password = body.password || ''
    const port = body.port || (body.protocol === 'sftp' ? 22 : 21)
    const path = body.path || '/'

    // Decide protocol by explicit flag or SFTP-like port
    const isSftp = body.protocol === 'sftp' || String(port) === '22' || String(port) === '8010'
    console.log('[API][FTP] Credentials parsed', {
      host,
      port,
      username: username ? '(provided)' : '(empty)',
      protocol: isSftp ? 'sftp' : 'ftp',
      path,
    })

    const fetcher = isSftp ? fetchViaSftp : fetchViaFtp
    const startedAt = Date.now()
    const files = await fetcher({ host, port, username, password, path })
    const elapsedMs = Date.now() - startedAt
    console.log('[API][FTP] Fetch completed', { count: files.length, elapsedMs })
    if (files.length) {
      console.log('[API][FTP] First few files', files.slice(0, 5).map(f => f.name))
    }
    return NextResponse.json({ ok: true, files })
  } catch (err: any) {
    const message = err?.message || String(err)
    console.error('[API][FTP] Error', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

// ---------- Upload (PUT) ----------
type UploadBody = Credentials & { files: OutFile[] }

async function uploadViaFtp(creds: Required<Pick<Credentials, 'host' | 'port' | 'username' | 'password'>> & { base: string }, files: OutFile[]) {
  const ftp = await import('basic-ftp')
  const client = new ftp.Client(20000)
  client.ftp.verbose = false
  try {
    await client.access({
      host: creds.host,
      port: creds.port,
      user: creds.username,
      password: creds.password,
      secure: false,
    })
    for (const f of files) {
      const remotePath = '/' + (creds.base ? creds.base.replace(/^\/+|\/+$/g, '') + '/' : '') + f.name.replace(/^\/+/, '')
      const dir = remotePath.slice(0, remotePath.lastIndexOf('/')) || '/'
      await client.ensureDir(dir)
      await (client as any).uploadFrom(Buffer.from(f.content, 'utf-8'), remotePath)
    }
  } finally {
    client.close()
  }
}

async function uploadViaSftp(creds: Required<Pick<Credentials, 'host' | 'port' | 'username' | 'password'>> & { base: string }, files: OutFile[]) {
  const SFTP = (await import('ssh2-sftp-client')).default
  const sftp = new SFTP()
  try {
    await sftp.connect({
      host: creds.host,
      port: creds.port,
      username: creds.username,
      password: creds.password,
      readyTimeout: 20000,
    })
    const mkdirp = async (dir: string) => {
      if (!dir || dir === '/') return
      const parts = dir.split('/').filter(Boolean)
      let cur = ''
      for (const p of parts) {
        cur += '/' + p
        try {
          // @ts-ignore
          const exists = await sftp.exists(cur)
          if (!exists) {
            await sftp.mkdir(cur, true)
          }
        } catch {
          try { await sftp.mkdir(cur, true) } catch {}
        }
      }
    }
    for (const f of files) {
      const remotePath = '/' + (creds.base ? creds.base.replace(/^\/+|\/+$/g, '') + '/' : '') + f.name.replace(/^\/+/, '')
      const dir = remotePath.slice(0, remotePath.lastIndexOf('/')) || '/'
      await mkdirp(dir)
      await sftp.put(Buffer.from(f.content, 'utf-8'), remotePath)
    }
  } finally {
    try { await sftp.end() } catch {}
  }
}

export async function PUT(req: Request) {
  try {
    console.log('[API][FTP] Incoming PUT /api/ftp (upload)')
    const body = await req.json() as UploadBody
    const host = (body.host || '').trim()
    if (!host) return NextResponse.json({ error: 'host is required' }, { status: 400 })
    const username = body.username || ''
    const password = body.password || ''
    const port = body.port || (body.protocol === 'sftp' ? 22 : 21)
    const base = body.path || '/'
    const files = Array.isArray(body.files) ? body.files : []
    if (!files.length) return NextResponse.json({ error: 'files required' }, { status: 400 })

    const isSftp = body.protocol === 'sftp' || String(port) === '22' || String(port) === '8010'
    console.log('[API][FTP] Upload parsed', {
      host, port, protocol: isSftp ? 'sftp' : 'ftp', base, files: files.length,
    })

    const startedAt = Date.now()
    if (isSftp) {
      await uploadViaSftp({ host, port, username, password, base }, files)
    } else {
      await uploadViaFtp({ host, port, username, password, base }, files)
    }
    const elapsedMs = Date.now() - startedAt
    console.log('[API][FTP] Upload completed', { elapsedMs })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    const message = err?.message || String(err)
    console.error('[API][FTP] Upload error', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

