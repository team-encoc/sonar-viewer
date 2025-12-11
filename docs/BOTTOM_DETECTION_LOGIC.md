# Sonar Radar 바닥 감지 로직 변경 사항

## 파일 위치
`src/utils/colorMapping.ts` - `signalToColorT03Average` 함수

---

## 1. 개요

어군 탐지기 소나 데이터에서 바닥(Bottom) 영역을 감지하고 색상을 적용하는 로직입니다.

---

## 2. 핵심 변경 사항

### 2.1 처리 순서 변경

```
[기존]
1. 노이즈 필터링 (raw < 0.5 → 투명)
2. 바닥 감지
→ 문제: raw=0이면 바닥 감지 로직까지 도달하지 못함

[변경 후]
1. 바닥 감지 먼저 실행
2. 바닥 영역이면 → 갈색 그라데이션 (raw 값 무관)
3. 바닥 아니면 → 노이즈 필터링 후 물고기/물 영역 처리
```

### 2.2 새로운 바닥 감지 조건 (Dual Condition Strategy)

| 조건 | 설명 | 코드 |
|------|------|------|
| **조건 1** | 값 >= 30 이면서 다음 값이 70~80 | `current >= 30 && next >= 70` |
| **조건 1b** | 값 >= 20 이면서 3칸 이내에 70~80 존재 | `current >= 20 && hasNearMax` |
| **조건 2** | 30+ 값이 연속 3개 이상 | `current >= 30 && next >= 30 && next2 >= 30` |

### 2.3 Threshold 상수

```typescript
const STRONG_SIGNAL_THRESHOLD = 30;  // 강한 신호 기준
const NEAR_MAX_THRESHOLD = 70;       // 80에 가까운 값 기준
```

---

## 3. CSV 데이터 분석 결과

실제 소나 패킷 데이터 분석:

```
물 영역:     0~5 (대부분 0)
바닥 신호:   20~78 (강한 반사)
80 (0x50):   측정 범위 초과 마커 (바닥 자체가 아님)
```

### 데이터 예시

```
[0, 0, 0, 32, 56, 52, 23, 11, 0, 80, 80, 40, 80, 12, 0, 0]
          ↑                        ↑
     바닥 시작 (32)          범위 초과 마커
```

| Row | 패턴 | 바닥 시작점 |
|-----|------|------------|
| Row 4 | `[..., 0, 2, 18, 74, 80, 80]` | 18 또는 74 |
| Row 6 | `[..., 4, 9, 55, 80, 76]` | 55 |
| Row 11 | `[..., 33, 11, 36, 14, 40, 78, 80]` | 33 |

---

## 4. 색상 매핑

### 4.1 바닥 영역 색상

```typescript
const isBottomArea = bottomStartIndex !== -1 && depthIndex >= bottomStartIndex;

if (isBottomArea) {
  const normalizedSignal = Math.min(80, Math.max(0, raw)) / 80;
  const lightBrown = hexToRgba("#DC8C1E");   // raw=0: 밝은 갈색
  const veryDarkBrown = hexToRgba("#5A1F0F"); // raw=80: 진한 갈색
  return lerpColor(lightBrown, veryDarkBrown, normalizedSignal);
}
```

### 4.2 색상 테이블

| 영역 | raw = 0 | raw = 30~50 | raw = 80 |
|------|---------|-------------|----------|
| **바닥** | #DC8C1E (밝은 갈색) | 중간 갈색 | #5A1F0F (진한 갈색) |
| **물** | 투명 (alpha=0) | 노란색/초록색 | 노란색/초록색 |

---

## 5. 바닥 감지 알고리즘 상세

### 5.1 바닥 시작 인덱스 찾기

```typescript
for (let i = 0; i < allDepthValues.length - 1; i++) {
  const current = allDepthValues[i];
  const next = allDepthValues[i + 1];

  if (current >= 80) continue; // 이미 높은 값은 스킵

  // 조건 1: 값 >= 30 이면서 다음에 70~80이 오면
  if (current >= STRONG_SIGNAL_THRESHOLD && next >= NEAR_MAX_THRESHOLD) {
    bottomStartIndex = i;
    break;
  }

  // 조건 2: 30+ 값이 연속 3개
  if (i < allDepthValues.length - 2) {
    const next2 = allDepthValues[i + 2];
    if (current >= 30 && next >= 30 && next2 >= 30) {
      bottomStartIndex = i;
      break;
    }
  }

  // 조건 1b: 값 >= 20 이면서 3칸 이내에 70~80 존재
  if (current >= 20 && current > waterAverage * 5) {
    let hasNearMax = false;
    for (let j = 1; j <= 3 && i + j < allDepthValues.length; j++) {
      if (allDepthValues[i + j] >= 70) {
        hasNearMax = true;
        break;
      }
    }
    if (hasNearMax) {
      bottomStartIndex = i;
      break;
    }
  }
}
```

### 5.2 바닥 종료 인덱스 찾기

```typescript
// 바닥 시작 후 peak 찾기
for (let i = bottomStartIndex; i < Math.min(bottomStartIndex + 10, length); i++) {
  if (allDepthValues[i] >= 80) {
    peakIndex = i;
    break;
  }
}

// 연속 3개 낮은 값(< 10)이 나올 때까지 바닥 영역 확장
for (let i = peakIndex + 1; i < length - 2; i++) {
  if (current >= 30 || current >= 80) {
    bottomEndIndex = i;
  }
  if (current < 10 && next1 < 10 && next2 < 10) {
    break;
  }
}
```

---

## 6. 물 영역 평균 계산

```typescript
// 물 영역 평균 (값 < 30, 80 제외)
let waterSum = 0;
let waterCount = 0;
for (let i = 0; i < allDepthValues.length; i++) {
  const val = allDepthValues[i];
  if (val < 30 && val < 80) {
    waterSum += val;
    waterCount++;
  }
}
const waterAverage = waterCount > 0 ? waterSum / waterCount : 2;
```

---

## 7. 디버그 로그

```typescript
if (depthIndex === 0) {
  console.log("[T03Average Debug]", {
    waterAverage,
    bottomStartIndex,
    bottomEndIndex,
    secondReflectionStartIndex,
    BOTTOM_THRESHOLD,
    aboveBottomAverage,
    minFishThreshold,
    p95,
    maxSignal,
    sampleValues: allDepthValues.slice(0, 50),
  });
}
```

---

## 8. 요약

1. **바닥 감지 우선**: 노이즈 필터링 전에 바닥 감지 실행
2. **Dual Condition**: 두 가지 조건 조합으로 바닥 시작점 탐지
3. **80 값 처리**: 80(0x50)은 범위 초과 마커이며, 바닥 자체가 아님
4. **갈색 그라데이션**: 바닥 영역은 raw 값에 따라 밝은 갈색 ~ 진한 갈색
5. **투명 처리**: 물 영역에서 raw < 0.5는 투명 처리

---

*Last Updated: 2025-12-08*
