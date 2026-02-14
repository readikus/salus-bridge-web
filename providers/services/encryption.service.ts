import { encrypt, decrypt } from "@/providers/database/encryption";

export class EncryptionService {
  /**
   * Encrypt a single field value.
   */
  static encryptField(value: string): string {
    return encrypt(value);
  }

  /**
   * Decrypt a single field value.
   */
  static decryptField(value: string): string {
    return decrypt(value);
  }

  /**
   * Encrypt specified fields in an object, returning a new object with encrypted values.
   */
  static encryptObject(obj: Record<string, string>, fields: string[]): Record<string, string> {
    const result = { ...obj };
    for (const field of fields) {
      if (result[field] !== undefined && result[field] !== null) {
        result[field] = encrypt(result[field]);
      }
    }
    return result;
  }

  /**
   * Decrypt specified fields in an object, returning a new object with decrypted values.
   */
  static decryptObject(obj: Record<string, string>, fields: string[]): Record<string, string> {
    const result = { ...obj };
    for (const field of fields) {
      if (result[field] !== undefined && result[field] !== null) {
        result[field] = decrypt(result[field]);
      }
    }
    return result;
  }
}
