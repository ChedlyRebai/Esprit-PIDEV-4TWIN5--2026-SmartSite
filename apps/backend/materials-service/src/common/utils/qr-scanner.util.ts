import * as fs from 'fs';
import * as path from 'path';
const Jimp = require('jimp');
const QrCode = require('qrcode-reader');

export class QRScannerUtil {
  /**
   * Scanner un QR code depuis un fichier image
   */
  static async scanFromImage(imagePath: string): Promise<string> {
    try {
      // Lire l'image avec Jimp
      const image = await Jimp.read(fs.readFileSync(imagePath));
      
      // Créer une instance du reader QR code
      const qrCodeReader = new QrCode();
      
      // Scanner le QR code
      const value = await new Promise((resolve, reject) => {
        qrCodeReader.callback = (err: any, value: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(value.result);
          }
        };
        qrCodeReader.decode(image.bitmap);
      });
      
      return value as string;
    } catch (error) {
      throw new Error(`Erreur scan QR: ${error.message}`);
    }
  }

  /**
   * Scanner un QR code depuis un buffer
   */
  static async scanFromBuffer(buffer: Buffer): Promise<string> {
    try {
      const image = await Jimp.read(buffer);
      const qrCodeReader = new QrCode();
      
      const value = await new Promise((resolve, reject) => {
        qrCodeReader.callback = (err: any, value: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(value.result);
          }
        };
        qrCodeReader.decode(image.bitmap);
      });
      
      return value as string;
    } catch (error) {
      throw new Error(`Erreur scan QR: ${error.message}`);
    }
  }

  /**
   * Parser les données du QR code
   */
  static parseQRData(qrData: string): any {
    try {
      // Essayer de parser comme JSON
      return JSON.parse(qrData);
    } catch {
      // Si ce n'est pas du JSON, retourner comme texte
      return { code: qrData };
    }
  }

  /**
   * Valider si une chaîne est un QR code valide
   */
  static isValidQR(qrData: string): boolean {
    return !!(qrData && qrData.length > 0);
  }
}