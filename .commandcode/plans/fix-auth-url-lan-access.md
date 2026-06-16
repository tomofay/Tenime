# Fix: AUTH_URL Mismatch — LAN Access Stuck Loading

## Root Cause

`.env` berisi `AUTH_URL="http://0.0.0.0:3000"`. NextAuth v5 memakai nilai ini untuk CSRF validation dan cookie signing. Saat browser akses dari `http://192.168.0.102:3000`, origin-nya nggak cocok — `SessionProvider` gagal resolve session, seluruh app hang di loading.

## Fix

### 1. `.env` — hapus `AUTH_URL`
Hapus/comentar baris `AUTH_URL="http://0.0.0.0:3000"`. NextAuth akan auto-detect dari Host header.

### 2. `src/lib/auth.ts` — tambah `trustHost: true`
Biar NextAuth selalu percaya Host header request.

### 3. `.env.example` — tambah komentar penjelas

## Verifikasi
1. Restart dev server
2. Test `http://localhost:3000`
3. Test `http://192.168.0.102:3000`
4. Test `http://127.0.0.1:3000`
