#!/usr/bin/env python3
"""
Test script to verify second reflection detection logic
Simulates the TypeScript logic for T10 data
"""

# T10 average data from T10.md
t10_data = [
    0.00, 0.00, 0.01, 0.00, 0.01, 0.00, 0.00, 0.01, 0.00, 0.02,
    0.00, 0.00, 0.01, 0.00, 0.00, 0.00, 0.00, 0.01, 0.00, 0.01,
    0.07, 0.41, 0.06, 0.57, 0.46, 10.33, 21.43, 21.73, 21.32, 6.48,
    8.71, 7.60, 7.04, 12.97, 8.38, 14.43, 19.81, 16.51, 15.72, 11.52,
    9.68, 8.94, 8.76, 39.04, 79.96, 79.84, 78.97, 57.95, 37.89, 37.30,
    18.67, 14.34, 23.91, 42.28, 28.36, 28.88, 71.09, 77.71, 70.24, 58.79,
    36.99, 37.81, 35.31, 24.77, 35.83, 33.55, 25.62, 39.06, 62.97, 39.62,
    38.02, 55.34, 67.89, 61.86, 49.81, 61.43, 79.95, 79.99, 79.90, 79.23,
    63.82, 58.30, 38.08, 35.50, 50.05, 41.83, 42.12, 34.74, 0.00, 0.00
]

# Step 1: Filter and sort for percentile calculation
valid_values = [v for v in t10_data if 2.0 <= v < 80]
valid_values.sort()
valid_count = len(valid_values)

p90_idx = int(valid_count * 0.90)
p90 = valid_values[p90_idx] if valid_count > 0 else 20
max_signal = valid_values[-1] if valid_count > 0 else 79

BOTTOM_THRESHOLD = max(p90, max_signal * 0.75)

print(f"Valid values count: {valid_count}")
print(f"P90: {p90:.2f}")
print(f"Max signal: {max_signal:.2f}")
print(f"BOTTOM_THRESHOLD: {BOTTOM_THRESHOLD:.2f}")
print()

# Step 2: Find first 80 value (or close to 80, like 79.5+)
first_80_idx = -1
for i, val in enumerate(t10_data):
    if val >= 79.5:
        first_80_idx = i
        break

print(f"First 80 value at index: {first_80_idx}")

# Step 3: Find bottom start (look backwards from first 80)
bottom_start_idx = first_80_idx
if first_80_idx != -1:
    for i in range(first_80_idx - 1, max(0, first_80_idx - 5) - 1, -1):
        val = t10_data[i]
        if 20 < val < 80:
            bottom_start_idx = i
            break

bottom_end_idx = first_80_idx

print(f"Bottom start index: {bottom_start_idx} (value: {t10_data[bottom_start_idx]:.2f})")
print(f"Bottom end index: {bottom_end_idx} (value: {t10_data[bottom_end_idx]:.2f})")
print()

# Step 4: Detect second reflection
second_reflection_idx = -1
if bottom_start_idx != -1 and bottom_end_idx != -1:
    search_start = int(bottom_end_idx + bottom_start_idx * 0.5)
    search_end = min(len(t10_data), int(bottom_end_idx + bottom_start_idx * 1.5))

    print(f"Searching for second reflection in range [{search_start}, {search_end})")

    second_reflection_threshold = BOTTOM_THRESHOLD * 0.5
    print(f"Second reflection threshold: {second_reflection_threshold:.2f}")
    print()

    for i in range(search_start, search_end - 2):
        current = t10_data[i]
        next1 = t10_data[i + 1]
        next2 = t10_data[i + 2]

        if current >= 80 or next1 >= 80 or next2 >= 80:
            continue

        if current > second_reflection_threshold and next1 > second_reflection_threshold and next2 > second_reflection_threshold:
            second_reflection_idx = i
            print(f"Found second reflection at index {i}:")
            print(f"  Values: {current:.2f}, {next1:.2f}, {next2:.2f}")
            break

if second_reflection_idx == -1:
    print("No second reflection detected")
else:
    print(f"\nSecond reflection starts at index: {second_reflection_idx}")

print("\n=== VISUALIZATION ===")
for i, val in enumerate(t10_data):
    marker = ""
    if i == bottom_start_idx:
        marker = " <- BOTTOM START"
    elif i == bottom_end_idx:
        marker = " <- BOTTOM END"
    elif second_reflection_idx != -1 and i == second_reflection_idx:
        marker = " <- SECOND REFLECTION START (WILL BE HIDDEN)"
    elif bottom_start_idx <= i < bottom_end_idx:
        marker = " [BOTTOM AREA]"
    elif second_reflection_idx != -1 and i >= second_reflection_idx:
        marker = " [HIDDEN]"

    print(f"Depth {i:2d}: {val:6.2f}{marker}")
