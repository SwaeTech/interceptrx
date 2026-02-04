import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

// Get master key from environment variable
function getMasterKey(): Buffer {
  const masterKey = process.env.ENVELOPE_MASTER_KEY;
  if (!masterKey) {
    throw new Error("ENVELOPE_MASTER_KEY not found in environment variables");
  }
  // Hash the master key to ensure it's exactly 32 bytes
  return crypto.createHash("sha256").update(masterKey).digest();
}

// Generate a random DEK (Data Encryption Key)
export function generateDEK(): Buffer {
  return crypto.randomBytes(KEY_LENGTH);
}

// Encrypt data with a key (used for both token encryption and DEK encryption)
function encrypt(data: string, key: Buffer): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Combine iv + authTag + encrypted data
  return iv.toString("hex") + authTag.toString("hex") + encrypted;
}

// Decrypt data with a key
function decrypt(encryptedData: string, key: Buffer): string {
  const ivHex = encryptedData.slice(0, IV_LENGTH * 2);
  const authTagHex = encryptedData.slice(
    IV_LENGTH * 2,
    (IV_LENGTH + AUTH_TAG_LENGTH) * 2,
  );
  const encrypted = encryptedData.slice((IV_LENGTH + AUTH_TAG_LENGTH) * 2);

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// Envelope encryption: encrypt token with DEK, then encrypt DEK with master key
export function envelopeEncrypt(token: string): {
  encryptedToken: string;
  encryptedDek: string;
} {
  const dek = generateDEK();
  const masterKey = getMasterKey();

  const encryptedToken = encrypt(token, dek);
  const encryptedDek = encrypt(dek.toString("hex"), masterKey);

  return { encryptedToken, encryptedDek };
}

// Envelope decryption: decrypt DEK with master key, then decrypt token with DEK
export function envelopeDecrypt(
  encryptedToken: string,
  encryptedDek: string,
): string {
  const masterKey = getMasterKey();

  const dekHex = decrypt(encryptedDek, masterKey);
  const dek = Buffer.from(dekHex, "hex");

  const token = decrypt(encryptedToken, dek);

  return token;
}

// Get pepper from environment variable
function getPepper(): string {
  const pepper = process.env.PEPPER_HASH;
  if (!pepper) {
    throw new Error("PEPPER_HASH not found in environment variables");
  }
  return pepper;
}

// Hash a token with pepper (for creating blind index/searchable hash)
export function hashWithPepper(token: string): string {
  const pepper = getPepper();

  // Combine token with pepper and hash using SHA-256
  const hash = crypto
    .createHash("sha256")
    .update(token + pepper)
    .digest("hex");

  return hash;
}

// Verify a token against a peppered hash
export function verifyHashWithPepper(token: string, hash: string): boolean {
  const computedHash = hashWithPepper(token);
  return computedHash === hash;
}
