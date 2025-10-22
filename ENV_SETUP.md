# Environment Variables Setup

## Overview

Hệ thống sử dụng các biến môi trường để cấu hình API endpoints. Không có URL nào được hardcode trong code.

## Development Setup

1. **Copy file mẫu:**
```bash
cp .env.example .env.local
```

2. **File `.env.local` (đã tạo sẵn):**
```bash
# API Backend URL (cho client-side fetch calls)
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# API Backend URL (cho server-side rewrites)
API_BACKEND_URL=http://localhost:8000
```

3. **Restart Next.js dev server sau khi thay đổi .env:**
```bash
# Stop server (Ctrl+C) rồi chạy lại
npm run dev
```

## API Usage trong Code

### 1. Seafood API (`lib/seafood-api.ts`)
Dùng cho: Products, Orders, Categories, Dashboard Stats

```typescript
import { productsAPI, ordersAPI } from '@/lib/seafood-api'

// Tự động dùng NEXT_PUBLIC_API_URL
const products = await productsAPI.list()
const orders = await ordersAPI.list()
```

### 2. Auth & RBAC API (`lib/api.ts`)
Dùng cho: Authentication, Users, Roles, Permissions

```typescript
import { authAPI, rbacAPI } from '@/lib/api'

// Tự động dùng NEXT_PUBLIC_API_URL
const users = await authAPI.getUsers(token)
const roles = await rbacAPI.getRoles()
```

### 3. Custom API Calls (trong components)
Dùng biến môi trường:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const response = await fetch(`${API_URL}/seafood/orders/${id}`)
```

## Production Setup

### Option 1: Vercel / Netlify
Thêm environment variables trong dashboard:

```
NEXT_PUBLIC_API_URL=https://api.yourcompany.com/api
API_BACKEND_URL=https://api.yourcompany.com
```

### Option 2: Docker
Tạo file `.env.production`:

```bash
NEXT_PUBLIC_API_URL=https://api.yourcompany.com/api
API_BACKEND_URL=http://backend:8000
```

### Option 3: Build-time
Set khi build:

```bash
NEXT_PUBLIC_API_URL=https://api.yourcompany.com/api npm run build
```

## Files Sử Dụng Env Variables

✅ `lib/seafood-api.ts` - NEXT_PUBLIC_API_URL
✅ `lib/api.ts` - NEXT_PUBLIC_API_URL (client) / API_URL (server)
✅ `next.config.ts` - API_BACKEND_URL (cho rewrites)
✅ `app/dashboard/orders/[id]/page.tsx` - NEXT_PUBLIC_API_URL
✅ Tất cả pages khác dùng qua lib/seafood-api.ts hoặc lib/api.ts

## Lưu Ý Quan Trọng

### Prefix `NEXT_PUBLIC_`
- Chỉ các biến có prefix `NEXT_PUBLIC_` mới được expose ra browser
- Biến không có prefix chỉ dùng được ở server-side (SSR, API routes)

### Rewrites vs Direct Calls
- Next.js rewrites (`/api/*` → backend) dùng cho auth/login
- Direct API calls dùng `NEXT_PUBLIC_API_URL` cho các trang dashboard

### CORS
Nếu gọi trực tiếp từ browser sang backend khác domain, backend cần enable CORS:

```python
# Django settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://yourfrontend.com",
]
```

## Troubleshooting

### Lỗi: Cannot connect to API
1. Kiểm tra backend đang chạy: `curl http://localhost:8000/api/health`
2. Kiểm tra `.env.local` có đúng URL không
3. Restart Next.js dev server

### Lỗi: Env variable không update
1. Restart dev server sau khi thay đổi `.env.local`
2. Clear browser cache: `rm -rf .next`
3. Rebuild: `npm run dev`

### Lỗi: API_URL is undefined
1. Đảm bảo dùng prefix `NEXT_PUBLIC_` cho client-side variables
2. Kiểm tra file `.env.local` tồn tại
3. Log ra để debug: `console.log(process.env.NEXT_PUBLIC_API_URL)`
