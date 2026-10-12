/**
 * SVG Barcode Generator and Label Renderer
 * Renders standard barcode lines and printable fashion price tags
 */

export function generateBarcodeLines(code: string): { width: number; x: number }[] {
  // Deterministic pseudo-code 128 visual barcode pattern generator
  const bars: { width: number; x: number }[] = [];
  let currentX = 10;
  
  // Guard bars start
  bars.push({ width: 2, x: currentX }); currentX += 3;
  bars.push({ width: 1, x: currentX }); currentX += 2;
  bars.push({ width: 2, x: currentX }); currentX += 4;

  // Encode each character into 2-3 bar sequences
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const w1 = (charCode % 3) + 1;
    bars.push({ width: w1, x: currentX });
    currentX += w1 + 1 + ((charCode >> 1) % 2);
    
    const w2 = ((charCode + 1) % 2) + 1;
    bars.push({ width: w2, x: currentX });
    currentX += w2 + 2;
  }

  // Guard bars stop
  bars.push({ width: 2, x: currentX }); currentX += 3;
  bars.push({ width: 1, x: currentX }); currentX += 2;
  bars.push({ width: 3, x: currentX }); currentX += 5;

  return bars;
}

export interface BarcodeLabelProps {
  storeName: string;
  productName: string;
  sku: string;
  barcode: string;
  sizeLabel: string;
  colorLabel: string;
  conditionGrade?: string;
  sellingPrice: number;
}
