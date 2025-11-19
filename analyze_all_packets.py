#!/usr/bin/env python3
"""
Analyze depth averages for all CSV files in packetData/ folder
Shows aggregate averages across all files and per-file averages
"""
import os
import statistics
from pathlib import Path

def parse_csv_file(filepath):
    """Parse a single CSV file and extract all sonar packets"""
    packets = []

    with open(filepath, 'r') as f:
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
        packets.append(sonar_samples)

    return packets

def calculate_depth_averages(all_packets):
    """Calculate average for each depth (0-89) from list of packets"""
    if not all_packets:
        return [0.0] * 90

    depth_averages = []
    for depth_idx in range(90):
        values_at_depth = [packet[depth_idx] for packet in all_packets]
        avg = statistics.mean(values_at_depth)
        depth_averages.append(avg)

    return depth_averages

def analyze_all_packets(packet_data_dir='packetData'):
    """Analyze all CSV files in the packet data directory"""

    # Check if directory exists
    if not os.path.exists(packet_data_dir):
        print(f"Error: Directory '{packet_data_dir}' does not exist.")
        print(f"Please create the directory and add CSV files to it.")
        return

    # Find all CSV files
    csv_files = list(Path(packet_data_dir).glob('*.csv'))

    if not csv_files:
        print(f"No CSV files found in '{packet_data_dir}/' directory.")
        return

    print(f"Found {len(csv_files)} CSV file(s) in '{packet_data_dir}/'")
    print("=" * 80)
    print()

    # Store all packets from all files for aggregate calculation
    all_packets_combined = []

    # Store per-file results
    file_results = []

    # Process each CSV file
    for csv_file in sorted(csv_files):
        packets = parse_csv_file(csv_file)
        all_packets_combined.extend(packets)

        if packets:
            depth_averages = calculate_depth_averages(packets)
            file_results.append({
                'filename': csv_file.name,
                'packet_count': len(packets),
                'averages': depth_averages
            })
            print(f"✓ Loaded {csv_file.name}: {len(packets)} packets")
        else:
            print(f"✗ {csv_file.name}: No valid packets found")

    print()
    print("=" * 80)
    print()

    # Calculate aggregate averages
    if all_packets_combined:
        aggregate_averages = calculate_depth_averages(all_packets_combined)

        # Print aggregate results
        print(f"AGGREGATE (all files combined)")
        print(f"Total packets: {len(all_packets_combined)}")
        print(f"-" * 80)
        for depth_idx in range(90):
            print(f"{depth_idx}depth : {aggregate_averages[depth_idx]:.2f}")

        print()
        print("=" * 80)
        print()

        # Print per-file results
        for result in file_results:
            print(f"FILE: {result['filename']}")
            print(f"Packets: {result['packet_count']}")
            print(f"-" * 80)
            for depth_idx in range(90):
                print(f"{depth_idx}depth : {result['averages'][depth_idx]:.2f}")
            print()
            print("=" * 80)
            print()
    else:
        print("No valid packets found in any files.")

if __name__ == '__main__':
    analyze_all_packets()
