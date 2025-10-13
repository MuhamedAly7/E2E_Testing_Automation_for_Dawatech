export class Utils {
  static generateBarcode(): string {
    // GTIN: fixed full 14 digits (no need to assemble parts)
    // Only last 4 digits should be randomized
    const gtinFixedStart = "0628509600"; // First 10 digits
    const gtinRandomEnd = Utils.randomDigits(4); // Last 4 random digits
    const gtin = `${gtinFixedStart}${gtinRandomEnd}`; // 14-digit GTIN

    // Serial Number: S + 2 uppercase letters + 2 digits (e.g., SNN77)
    const serial = `S${Utils.randomUppercaseLetters(2)}${Utils.randomDigits(
      2
    )}`;

    // Expiry Date: fixed value "301212" (YYMMDD)
    const expiry = "301212";

    // Batch Number: B + 2 uppercase letters + 2 digits (e.g., BNN77)
    const batch = `B${Utils.randomUppercaseLetters(2)}${Utils.randomDigits(2)}`;

    // Final Barcode: GS1 format
    return `01${gtin}21${serial}17${expiry}10${batch}`;
  }

  private static randomUppercaseLetters(length: number): string {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return Array.from(
      { length },
      () => letters[Math.floor(Math.random() * letters.length)]
    ).join("");
  }

  private static randomDigits(length: number): string {
    const digits = "0123456789";
    return Array.from(
      { length },
      () => digits[Math.floor(Math.random() * digits.length)]
    ).join("");
  }
}
