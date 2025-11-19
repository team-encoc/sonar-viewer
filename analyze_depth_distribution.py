#!/usr/bin/env python3
"""
Analyze depth-wise distribution of sonar data
"""
import sys
from collections import Counter
import statistics

def analyze_depth_distribution(filename):
    """Parse CSV and analyze sonar data depth-wise"""
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

    print(f"Total packets: {len(all_packets)}")
    print(f"\n{'='*80}")
    print(f"DEPTH-WISE ANALYSIS (90 samples per packet)")
    print(f"{'='*80}\n")

    # Analyze each depth position
    depth_stats = []
    for depth_idx in range(90):
        values_at_depth = [packet[depth_idx] for packet in all_packets]

        avg = statistics.mean(values_at_depth)
        median = statistics.median(values_at_depth)
        max_val = max(values_at_depth)
        min_val = min(values_at_depth)

        # Count non-zero values
        non_zero = sum(1 for v in values_at_depth if v > 0)
        non_zero_pct = (non_zero / len(values_at_depth)) * 100

        # Count significant signals (> 16)
        significant = sum(1 for v in values_at_depth if v > 16)
        significant_pct = (significant / len(values_at_depth)) * 100

        depth_stats.append({
            'depth': depth_idx,
            'avg': avg,
            'median': median,
            'max': max_val,
            'min': min_val,
            'non_zero_pct': non_zero_pct,
            'significant_pct': significant_pct
        })

    # Print summary by sections
    print("Depth sections (0=surface, 89=bottom):")
    print(f"{'Depth':>6} | {'Avg':>6} | {'Median':>6} | {'Max':>4} | Non-0%  | Sig% (>16)")
    print("-" * 65)

    # Show every 5th sample + first/last
    for i in [0, 1, 2, 3, 4] + list(range(5, 90, 5)) + [89]:
        stat = depth_stats[i]
        print(f"{stat['depth']:6d} | {stat['avg']:6.2f} | {stat['median']:6.2f} | "
              f"{stat['max']:4d} | {stat['non_zero_pct']:6.1f}% | {stat['significant_pct']:6.1f}%")

    # Find lure depth (highest average in middle section)
    middle_section = depth_stats[20:70]  # Middle 50 samples
    lure_depth = max(middle_section, key=lambda x: x['avg'])

    print(f"\n{'='*80}")
    print(f"LURE DETECTION")
    print(f"{'='*80}")
    print(f"Most likely lure position: Depth {lure_depth['depth']}")
    print(f"  - Average signal: {lure_depth['avg']:.2f}")
    print(f"  - Median signal: {lure_depth['median']:.2f}")
    print(f"  - Max signal: {lure_depth['max']}")

    # Find bottom depth (where strong signals consistently appear)
    bottom_candidates = [s for s in depth_stats if s['avg'] > 50]
    if bottom_candidates:
        bottom_depth = min(bottom_candidates, key=lambda x: x['depth'])
        print(f"\nMost likely bottom start: Depth {bottom_depth['depth']}")
        print(f"  - Average signal: {bottom_depth['avg']:.2f}")

    # Value distribution analysis
    print(f"\n{'='*80}")
    print(f"VALUE DISTRIBUTION BY DEPTH ZONE")
    print(f"{'='*80}\n")

    zones = [
        ("Surface (0-15)", 0, 15),
        ("Upper (16-30)", 16, 30),
        ("Middle (31-60)", 31, 60),
        ("Lower (61-75)", 61, 75),
        ("Bottom (76-89)", 76, 89),
    ]

    for zone_name, start, end in zones:
        zone_values = []
        for depth_idx in range(start, end + 1):
            zone_values.extend([packet[depth_idx] for packet in all_packets])

        counter = Counter(zone_values)
        avg = statistics.mean(zone_values)
        median = statistics.median(zone_values)

        print(f"{zone_name}:")
        print(f"  Average: {avg:.2f}, Median: {median:.2f}")

        # Show top 5 most common values
        top_values = counter.most_common(10)
        print(f"  Top values: {', '.join(f'{v}({c})' for v, c in top_values)}")
        print()

if __name__ == '__main__':
    if len(sys.argv) > 1:
        filename = sys.argv[1]
    else:
        filename = 'T02_SINGLE_MID_1LURE_ONLY_20251117_1812_v3.json.csv'

    print(f"Analyzing: {filename}\n")
    analyze_depth_distribution(filename)
