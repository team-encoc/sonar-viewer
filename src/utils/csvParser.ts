/**
 * CSV Parser for Sonar Data - Web Version
 * Parses CSV log files and extracts sonar packets
 */

export interface ParsedPacket {
  timestamp: string;
  temperature: number;
  depth: number;
  scanData: number[];
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = hex.trim().split(' ').map(part => parseInt(part, 16));
  return new Uint8Array(bytes);
}

/**
 * Read float from Big Endian bytes
 */
function readFloatBE(bytes: Uint8Array, offset: number): number {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setUint8(0, bytes[offset]);
  view.setUint8(1, bytes[offset + 1]);
  view.setUint8(2, bytes[offset + 2]);
  view.setUint8(3, bytes[offset + 3]);
  return view.getFloat32(0, false); // Big Endian
}

/**
 * Parse single packet from hex data
 */
function parsePacket(hexData: string, timestamp: string): ParsedPacket | null {
  const bytes = hexToBytes(hexData);

  // Scan packet is 182 bytes (B4 00 01 header)
  if (bytes.length < 182) {
    return null;
  }

  // Check header
  if (bytes[0] !== 0xB4 || bytes[1] !== 0x00 || bytes[2] !== 0x01) {
    return null;
  }

  // Extract data
  const temperature = readFloatBE(bytes, 3);  // Bytes 3-6
  const depth = readFloatBE(bytes, 88);       // Bytes 88-91

  // Extract 90 sonar samples (bytes 92-181)
  const scanData: number[] = [];
  for (let i = 92; i < 182; i++) {
    scanData.push(bytes[i]);
  }

  return {
    timestamp,
    temperature,
    depth,
    scanData
  };
}

/**
 * Parse entire CSV file
 * @param csvText - Raw CSV text content
 * @returns Array of parsed packets
 */
export function parseCSVFile(csvText: string): ParsedPacket[] {
  const lines = csvText.split('\n');
  const packets: ParsedPacket[] = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line: Direction,Timestamp,"Hex Data","Parsed Info",Error
    const match = line.match(/^([^,]+),([^,]+),"([^"]+)","([^"]*)",(.+)$/);
    if (!match) continue;

    const [, direction, timestamp, hexData] = match;

    // Only process RX (receive) packets
    if (direction !== 'RX') continue;

    const packet = parsePacket(hexData, timestamp);
    if (packet) {
      packets.push(packet);
    }
  }

  console.log(`Parsed ${packets.length} packets from CSV`);
  return packets;
}
