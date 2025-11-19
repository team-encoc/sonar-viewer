#!/usr/bin/env python3
"""
Get average values for each depth (0-89)
"""
import sys
import statistics

def get_depth_averages(filename):
    """Parse CSV and get average value for each depth"""
    all_packets = []

    with open(filename, 'r') as f:
        lines = f.readlines()

    # Skip header
    for line in lines[1:]:
        line = line.strip()
        if not line:
            continue

        parts = line.split(',', 2)
        if len(parts) < 3:
            continue

        direction = parts[0]
        if direction != 'RX':
            continue

        try:
            hex_start = line.index('"') + 1
            hex_end = line.index('"', hex_start)
            hex_data = line[hex_start:hex_end]
        except ValueError:
            continue

        hex_bytes = [int(b, 16) for b in hex_data.split()]

        if len(hex_bytes) < 182:
            continue

        # Extract sonar data (bytes 92-181 = 90 samples)
        sonar_samples = hex_bytes[92:182]
        all_packets.append(sonar_samples)

    print(f"Total packets analyzed: {len(all_packets)}")
    print(f"\nDepth averages (0-89):")
    print("="*50)

    # Calculate and print average for each depth
    for depth_idx in range(90):
        values_at_depth = [packet[depth_idx] for packet in all_packets]
        avg = statistics.mean(values_at_depth)
        print(f"{depth_idx}depth : {avg:.2f}")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        filename = sys.argv[1]
    else:
        filename = 'T02_SINGLE_MID_1LURE_ONLY_20251117_1812_v3.json.csv'

    get_depth_averages(filename)
