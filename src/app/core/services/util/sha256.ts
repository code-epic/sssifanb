import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class Sha256Service {
  private readonly K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  private rightRotate(value: number, shift: number): number {
    return (value >>> shift) | (value << (32 - shift));
  }

  public async hash(message: string): Promise<string> {
    // Convertir mensaje a buffer UTF-8
    const msgBuffer = new TextEncoder().encode(message);
    const len = msgBuffer.length * 8;

    // Añadir padding (1 + ceros + longitud de 64 bits)
    const totalLen = Math.ceil((len + 1 + 64) / 512) * 512;
    const padded = new Uint8Array(totalLen / 8);
    padded.set(msgBuffer);
    padded[msgBuffer.length] = 0x80; // Bit '1' del padding

    // Escribir longitud en bits al final (big-endian)
    const lenView = new DataView(padded.buffer);
    lenView.setUint32(padded.length - 4, len);

    // Inicializar variables de hash
    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

    // Procesar cada bloque de 512 bits (64 bytes)
    for (let i = 0; i < padded.length; i += 64) {
      const block = padded.slice(i, i + 64);
      const words = new Array(64);

      // Dividir bloque en 16 palabras de 32 bits (big-endian)
      const view = new DataView(block.buffer);
      for (let j = 0; j < 16; j++) {
        words[j] = view.getUint32(j * 4);
      }

      // Extender a 64 palabras
      for (let j = 16; j < 64; j++) {
        const s0 = this.rightRotate(words[j - 15], 7) ^ this.rightRotate(words[j - 15], 18) ^ (words[j - 15] >>> 3);
        const s1 = this.rightRotate(words[j - 2], 17) ^ this.rightRotate(words[j - 2], 19) ^ (words[j - 2] >>> 10);
        words[j] = (words[j - 16] + s0 + words[j - 7] + s1) >>> 0;
      }

      // Inicializar variables de trabajo
      let [a, b, c, d, e, f, g, h] = [h0, h1, h2, h3, h4, h5, h6, h7];

      // Compresión
      for (let j = 0; j < 64; j++) {
        const S1 = this.rightRotate(e, 6) ^ this.rightRotate(e, 11) ^ this.rightRotate(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + this.K[j] + words[j]) >>> 0;
        const S0 = this.rightRotate(a, 2) ^ this.rightRotate(a, 13) ^ this.rightRotate(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) >>> 0;

        h = g;
        g = f;
        f = e;
        e = (d + temp1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) >>> 0;
      }

      // Actualizar hash
      h0 = (h0 + a) >>> 0;
      h1 = (h1 + b) >>> 0;
      h2 = (h2 + c) >>> 0;
      h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0;
      h5 = (h5 + f) >>> 0;
      h6 = (h6 + g) >>> 0;
      h7 = (h7 + h) >>> 0;
    }

    // Combinar los hashes
    const hashArray = [h0, h1, h2, h3, h4, h5, h6, h7];
    return hashArray.map(h => h.toString(16).padStart(8, '0')).join('');
  }
  

  public async hmac(message: string, key: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(message);

    // Importar la llave para HMAC
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Firmar el mensaje
    const signature = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    );

    // Convertir el buffer resultante a Hexadecimal
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
    // Usando Web Crypto API para cifrar el contexto antes de enviarlo
  async EncryptDeviceContext(context: any, secretKey: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(context));

    // Generar un IV (Vector de Inicialización) único para esta petición
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Importar clave (esto es un ejemplo, la clave debe ser tratada con cuidado)
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(secretKey), "AES-GCM", false, ["encrypt"]
    );

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv }, key, data
    );

    // Unimos IV + Datos Cifrados y pasamos a Base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    let binary = '';
    for (let i = 0; i < combined.length; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  }
}