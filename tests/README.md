# Schedule Ninja - Parsing Accuracy Test Guide

## 🚀 테스트 실행 방법

### 1. 확장 프로그램 페이지에서 테스트 러너 열기

테스트 러너는 Chrome Extension context에서 실행되어야 합니다.

**Option A: Extension 페이지로 직접 열기**
```
chrome-extension://[EXTENSION_ID]/tests/test-runner.html
```

**Option B: 로컬 서버로 열기 (Live Server 등)**
```bash
cd /Users/yesinkim/Bailando/01_Lab/TimeKeeper/tests
npx serve .   # 또는 Live Server 사용
```
⚠️ 이 경우 Extension API 접근이 안 됨 - 별도 설정 필요

### 2. manifest.json에 테스트 페이지 등록 (권장)

`manifest.json`의 `web_accessible_resources`에 테스트 페이지 추가:

```json
{
  "web_accessible_resources": [
    {
      "resources": ["tests/*"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

### 3. 테스트 실행

1. 브라우저에서 `test-runner.html` 열기
2. "Run All Tests" 클릭
3. 테스트가 순차적으로 실행됨 (각 테스트 사이 1초 딜레이)
4. 결과 확인 및 CSV 내보내기

## 📊 결과 해석

| 지표 | 설명 |
|-----|-----|
| **Accuracy** | 전체 테스트 중 모든 필드가 일치한 비율 |
| **Summary Match** | 제목이 일치하는지 (부분 일치 허용) |
| **Start Match** | 시작 날짜가 일치하는지 |
| **End Match** | 종료 날짜가 일치하는지 |
| **Location Match** | 장소가 일치하는지 (부분 일치 허용) |

## 📁 테스트 데이터 위치

```
tests/datasets/
├── korean.json        (20개) - COEX, Lu.ma Seoul 
├── english.json       (15개) - Eventbrite 패턴
├── edge-cases.json    (20개) - 모호한 날짜, 혼합 언어
├── bookings.json      (15개) - CGV, KTX, 항공 예매
├── global-events.json (20개) - 글로벌 Crypto/Tech 이벤트
├── misc.json          (10개) - GDG, 대학 세미나 등
└── index.js           - 통합 모듈
```

**총 100개 테스트 케이스**
