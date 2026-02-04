# InterceptRx

A secure chat application demonstrating multi-level authorization with GraphQL, envelope encryption for secrets management, and real-time breach detection. Styled using brand guidelines from BreachRx.com

## Features

- **Multi-Level Authorization**:
  - **Mutation-level**: GraphQL Shield rules prevent unauthorized actions
  - **Row-level**: CASL + Prisma filter data by organization and role
  - **Field-level**: Sensitive fields (tokens) restricted to admins only
- **Envelope Encryption**: Secrets encrypted with AES-256-GCM using per-secret Data Encryption Keys (DEK)
- **Breach Detection**: SHA-256 pepper hashing creates blind indices to detect leaked tokens in chat messages
- **Real-time Chat**: GraphQL subscriptions with Ollama LLM integration
- **Organization Isolation**: Multi-tenant data scoping with org-level permissions

## Prerequisites

- **Node.js**: v20.20.0 (required for graphql-shield compatibility)
- **pnpm**: v10.23.0 or higher
- **Docker**: For PostgreSQL database
- **Ollama**: For LLM chat functionality

## Installation

### 1. Clone and Install Dependencies

```bash
cd InterceptRx
pnpm install
```

### 2. Install and Configure Ollama

```bash
# Install Ollama (macOS)
brew install ollama

# Pull the model
ollama pull llama3.2

# Start Ollama server (in a separate terminal)
ollama run llama3.2
```

Default Ollama API endpoint: http://localhost:11434

### 3. Set Up Environment Variables

Create `.env` file in `/app/api/` directory:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/interceptrx?schema=public"

# Encryption Keys (generate your own secure keys)
ENVELOPE_MASTER_KEY="your-32-byte-base64-master-key-here"
PEPPER_HASH="your-secret-pepper-string-here"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

**Generate secure keys:**

```bash
# For ENVELOPE_MASTER_KEY (32 bytes, base64)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# For PEPPER_HASH (any secure random string)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# For NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Create `.env.local` file in `/app/web/` directory:

```bash
NEXTAUTH_SECRET="same-as-api-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Start PostgreSQL Database

```bash
docker compose up -d
```

This starts PostgreSQL on port 5432 with credentials:

- User: `postgres`
- Password: `postgres`

### 5. Run Database Migrations

```bash
cd app/api
pnpx prisma migrate dev
```

### 6. Start the Application

From the project root:

```bash
pnpm dev
```

This starts:

- **API Server**: http://localhost:3001/graphql
- **Web Frontend**: http://localhost:3000

## Demo Credentials

All test accounts use password: `password`

| Email               | Role    | Organization | Permissions                                  |
| ------------------- | ------- | ------------ | -------------------------------------------- |
| admin1@example.com  | Admin   | org1         | Create/view secrets, view token values       |
| admin2@example.com  | Admin   | org2         | Create/view secrets (org2 only)              |
| manager@example.com | Manager | org1         | View secret names/metadata (no token access) |
| viewer@example.com  | Viewer  | org1         | Chat only (no sidebar access)                |

## Testing the Application

### 1. Login

Navigate to http://localhost:3000/login and sign in with any demo credential.

### 2. Test Multi-Level Permissions

**As Admin (admin1@example.com):**

- ✅ See sidebar with "add secret" form
- ✅ Create new secrets (min 16 characters)
- ✅ Click eye icon to view decrypted token values
- ✅ See organization name ("org1") above secrets list

**As Manager (manager@example.com):**

- ✅ See sidebar with secrets list
- ✅ View secret names and breach counts
- ❌ Cannot create secrets
- ❌ No eye icon (cannot view token values)

**As Viewer (viewer@example.com):**

- ❌ No sidebar access at all
- ✅ Can use chat interface

### 3. Test Organization Isolation

**As admin1@example.com (org1):**

- Create a secret named "API Key 1"

**As admin2@example.com (org2):**

- You will NOT see "API Key 1" (different org)
- Create a secret named "API Key 2"

**Switch back to admin1@example.com:**

- You will NOT see "API Key 2"

### 4. Test Breach Detection

**As Admin:**

1. Create a secret with token: `sk-test1234567890abcdef` (min 16 chars)
2. Copy the exact token value
3. In chat, send a message containing the token
4. You'll see a red warning: "⚠️ BREACH DETECTED..."
5. The secret's breach count increments (red badge appears after refreshing the screen)

### 5. Test Field-Level Permissions

**As Manager:**

1. Open browser DevTools → Network tab
2. Try to query a secret with the `token` field
3. You'll receive a GraphQL permission error

**As Admin:**

1. Click the eye icon on any secret
2. Token decrypts and displays successfully

## Project Structure

```
InterceptRx/
├── app/
│   ├── api/                    # GraphQL API server (Express + Apollo)
│   │   ├── graphql/
│   │   │   ├── permissions.ts  # GraphQL Shield rules
│   │   │   ├── resolvers/      # Query/Mutation/Subscription resolvers
│   │   │   └── type-defs/      # GraphQL schema definitions
│   │   ├── lib/
│   │   │   ├── abilities.ts    # CASL permission definitions
│   │   │   ├── encryption.ts   # Envelope encryption + pepper hashing
│   │   │   └── prisma.ts       # Prisma client
│   │   ├── services/
│   │   │   ├── secret.service.ts   # Secret CRUD + breach checking
│   │   │   └── message.service.ts  # Ollama integration + streaming
│   │   └── prisma/
│   │       └── schema.prisma   # Database schema
│   └── web/                    # Next.js frontend
│       ├── app/
│       │   ├── components/     # React components
│       │   ├── graphql/        # Apollo queries/mutations
│       │   └── page.tsx        # Main chat interface
│       └── auth.ts             # NextAuth configuration
├── compose.yaml                # Docker Compose (PostgreSQL)
└── package.json                # Workspace root
```

## Key Technologies

- **Backend**: Node.js, Express, Apollo Server, GraphQL Shield, CASL, Prisma
- **Frontend**: Next.js 16, React, Apollo Client, TailwindCSS
- **Database**: PostgreSQL
- **Auth**: NextAuth with credentials provider
- **LLM**: Ollama (llama3.2)
- **Security**: AES-256-GCM encryption, SHA-256 hashing

## Troubleshooting

**Port conflicts:**

- API uses port 3001, Web uses port 3000, PostgreSQL uses 5432
- Change ports in respective package.json scripts if needed

**Database connection errors:**

- Ensure Docker is running: `docker ps`
- Restart PostgreSQL: `docker compose restart`

**Ollama not responding:**

- Check Ollama is running: `ollama list`
- Restart: `ollama run llama3.2`

**GraphQL Shield errors:**

- Ensure Node.js v20.20.0 (graphql-shield has compatibility issues with v24+)
- Check with: `node --version`

## Development Commands

```bash
# Install dependencies
pnpm install

# Start dev servers (API + Web + PostgreSQL)
pnpm dev

# Run Prisma Studio (database GUI)
cd app/api && pnpx prisma studio

# Reset database
cd app/api && pnpx prisma migrate reset

# Generate Prisma client
cd app/api && pnpx prisma generate
```

## License

ISC
