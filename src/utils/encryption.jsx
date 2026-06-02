import CryptoJS from 'crypto-js';

function deriveKeyAndIV(passwordStr, saltBytes) {
  const passwordBytes = CryptoJS.enc.Utf8.parse(passwordStr);
  let concatenatedHashes = CryptoJS.lib.WordArray.create();
  let currentHash = CryptoJS.lib.WordArray.create();

  while (concatenatedHashes.sigBytes < (32 + 16)) {
    const hasher = CryptoJS.algo.MD5.create();
    hasher.update(currentHash);
    hasher.update(passwordBytes);
    hasher.update(saltBytes);
    currentHash = hasher.finalize();
    concatenatedHashes.concat(currentHash);
  }

  // Extract key (32 bytes / 8 words) and IV (16 bytes / 4 words)
  const key = CryptoJS.lib.WordArray.create(concatenatedHashes.words.slice(0, 8), 32);
  const iv = CryptoJS.lib.WordArray.create(concatenatedHashes.words.slice(8, 12), 16);

  return { key, iv };
}

/**
 * Encrypts a password to match the backend's EncryptionService decryption algorithm.
 * Format: "Salted__" (8 bytes) + Salt (8 bytes) + Ciphertext, Base64-encoded.
 */
export function encryptPassword(password) {
  const secret = "Waiz2026!";
  const salt = CryptoJS.lib.WordArray.random(8);

  const { key, iv } = deriveKeyAndIV(secret, salt);

  const encrypted = CryptoJS.AES.encrypt(password, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  const saltedMagic = CryptoJS.enc.Utf8.parse("Salted__");
  const cipherData = saltedMagic.concat(salt).concat(encrypted.ciphertext);

  return CryptoJS.enc.Base64.stringify(cipherData);
}
