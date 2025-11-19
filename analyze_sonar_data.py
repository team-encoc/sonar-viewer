#!/usr/bin/env python3
"""
Analyze sonar data distribution from CSV file
"""
import sys
from collections import Counter

def analyze_csv(filename):
    """Parse CSV and analyze sonar data (bytes 92-181)"""
    all_values = []
    packet_count = 0

    with open(filename, 'r') as f:
        lines = f.readlines()

    # Skip header
    for line in lines[1:]:
        line = line.strip()
        if not line:
            continue

        # Parse CSV: Direction,Timestamp,"Hex Data","Parsed Info",Error
        parts = line.split(',', 2)
        if len(parts) < 3:
            continue

        direction = parts[0]

        # Only process RX packets
        if direction != 'RX':
            continue

        # Extract hex data (between quotes)
        try:
            hex_start = line.index('"') + 1
            hex_end = line.index('"', hex_start)
            hex_data = line[hex_start:hex_end]
        except ValueError:
            continue

        # Parse hex bytes
        hex_bytes = [int(b, 16) for b in hex_data.split()]

        if len(hex_bytes) < 182:
            continue

        # Extract sonar data (bytes 92-181 = 90 samples)
        sonar_samples = hex_bytes[92:182]

        all_values.extend(sonar_samples)
        packet_count += 1

        if packet_count <= 5:  # Show first 5 packets as examples
            print(f"\nPacket {packet_count} sonar samples:")
            print(f"  Min: {min(sonar_samples)}, Max: {max(sonar_samples)}")
            print(f"  First 10: {sonar_samples[:10]}")
            print(f"  Last 10: {sonar_samples[-10:]}")

    # Overall statistics
    print(f"\n{'='*60}")
    print(f"OVERALL STATISTICS")
    print(f"{'='*60}")
    print(f"Total packets analyzed: {packet_count}")
    print(f"Total sonar values: {len(all_values)}")
    print(f"Min value: {min(all_values)}")
    print(f"Max value: {max(all_values)}")
    print(f"Unique values: {len(set(all_values))}")

    # Value distribution
    counter = Counter(all_values)
    print(f"\n{'='*60}")
    print(f"VALUE DISTRIBUTION (Hex | Decimal | Count | Percentage)")
    print(f"{'='*60}")

    # Sort by value
    for value in sorted(counter.keys()):
        count = counter[value]
        percentage = (count / len(all_values)) * 100
        print(f"0x{value:02X} | {value:3d} | {count:6d} | {percentage:6.2f}%")

    # Range analysis
    print(f"\n{'='*60}")
    print(f"RANGE ANALYSIS")
    print(f"{'='*60}")

    ranges = [
        ("0x00-0x0F (0-15)", 0, 15),
        ("0x10-0x1F (16-31)", 16, 31),
        ("0x20-0x2F (32-47)", 32, 47),
        ("0x30-0x3F (48-63)", 48, 63),
        ("0x40-0x4F (64-79)", 64, 79),
        ("0x50-0x5F (80-95)", 80, 95),
    ]

    for range_name, start, end in ranges:
        range_count = sum(counter[v] for v in range(start, end + 1) if v in counter)
        range_pct = (range_count / len(all_values)) * 100
        print(f"{range_name}: {range_count:6d} ({range_pct:6.2f}%)")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        filename = sys.argv[1]
    else:
        filename = 'T02_SINGLE_MID_1LURE_ONLY_20251117_1812_v3.json.csv'

    print(f"Analyzing: {filename}\n")
    analyze_csv(filename)
