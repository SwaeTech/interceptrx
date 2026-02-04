## Domain & Data Model

### Domain Choice: Secrets Management with Breach Detection

This application demonstrates a **secrets management system** integrated with an AI chat interface. The domain was chosen to showcase complex security requirements including:

- **Multi-tenant isolation**: Organizations need to keep their secrets completely separate
- **Role-based access control**: Different permission levels (admin, manager, viewer) with varying secret access
- **Encryption at rest**: Secrets must be stored securely using industry-standard encryption
- **Breach monitoring**: Real-time detection of leaked secrets in communications
- **Audit compliance**: Complete audit trail of who accessed what and when

The AI chat integration serves dual purposes:

1. **Demonstrate breach detection**: Monitor chat messages for accidentally leaked secrets
2. **Real-world use case**: Teams often use chat tools where secrets might be accidentally shared

### Data Model

The application uses three core entities:

#### **User**

Represents authenticated users with role-based permissions.

```prisma
model User {
  id        String   @id @default(cuid(2))
  email     String   @unique
  name      String?
  password  String   // Hashed with bcrypt
  scopes    String[] // Roles: ['admin'], ['manager'], ['viewer']
  orgId     String   // Organization identifier for multi-tenancy
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Key Design Decisions:**

- `scopes` array allows flexible role assignment (users can have multiple roles)
- `orgId` enables organization-level data isolation
- Password stored as bcrypt hash (never plaintext)
- Email is unique constraint for authentication

#### **Secret**

Stores encrypted API keys, tokens, or other sensitive data.

```prisma
model Secret {
  id             String   @id @default(cuid(2))
  name           String   // Friendly name (e.g., "GitHub API Key")
  encryptedToken String?  // AES-256-GCM encrypted token
  encryptedDek   String?  // Encrypted Data Encryption Key (envelope encryption)
  blindIndex     String?  // SHA-256 hash for breach detection
  userId         String   // Creator of the secret
  orgId          String   // Organization owner
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**Key Design Decisions:**

- **Envelope encryption**: Each secret has its own DEK (Data Encryption Key), encrypted by a master key
- **Blind index**: SHA-256 hash with pepper allows breach detection without storing plaintext
- **Organization scoping**: Secrets belong to organizations, not individual users
- **Audit via field resolver**: `breachCount` calculated dynamically from Audit table (not stored as column)

#### **Audit**

Immutable log of all secret-related actions.

```prisma
model Audit {
  id        String   @id @default(cuid(2))
  secretId  String   // Which secret was accessed
  userId    String   // Who performed the action
  orgId     String   // Organization context
  action    String   // Action type: 'BREACH' (more actions in the future)
  details   String?  // Additional context (e.g., breach message excerpt)
  createdAt DateTime @default(now())
}
```

**Key Design Decisions:**

- **Immutable**: Audit entries are never updated or deleted (compliance requirement)
- **Action types**: Standardized actions ('BREACH') enable filtering and reporting
- **Organization scoping**: Audit logs filtered by organization for multi-tenancy
- **No foreign keys**: Soft references allow audit retention even if secrets/users are deleted

### Data Flow Examples

**Creating a Secret (Admin only):**

1. Admin submits secret name + token value via GraphQL mutation
2. System generates random DEK (Data Encryption Key)
3. Token encrypted with DEK using AES-256-GCM
4. DEK encrypted with master key (envelope encryption)
5. Blind index created: SHA-256(pepper + token)
6. All encrypted values stored in database

**Breach Detection Flow:**

1. User sends chat message to Ollama LLM
2. System checks all organization secrets' blind indices
3. For each secret: SHA-256(pepper + message_substring) compared to stored blind index
4. If match found: Breach detected
5. Audit entry created with action='BREACH'
6. User sees warning in chat UI
7. Secret's breachCount increments (via field resolver counting Audit entries)

**Role-Based Access:**

- **Admin**: Can create secrets, view decrypted tokens, see audit logs
- **Manager**: Can view secret names/metadata and audit logs, but NOT decrypt tokens
- **Viewer**: No access to secrets sidebar or audit logs, chat only

## Future Features

1. managers should only be able to see audit logs of people they manage (unlike admins who can see all audit logs)
2. implement sessions, token timeout, and keep alive for auth
3. implement sliding window for secret breach detection
4. implement more audit log actions like (VIEW) for secrets
