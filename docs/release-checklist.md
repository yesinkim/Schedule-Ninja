# Chrome 확장 프로그램 배포 체크리스트

> Schedule Ninja 배포 전 점검 사항

---

## 📋 체크리스트 요약

| 카테고리 | 완료 | 미완료 |
|----------|------|--------|
| 민감 정보 | 2 | 0 |
| 파일 정리 | 3 | 3 |
| 코드 최적화 | 1 | 2 |
| 기능 테스트 | 1 | 1 |
| 스토어 준비 | 1 | 1 |
| API 보안 | 1 | 2 |
| 해커톤 준비 | 4 | 3 |

---

## 1. 민감 정보 및 환경설정

- [x] `secrets.js` 실제 환경설정/비밀키 파일 포함 확인
- [x] `.gitignore`에 민감 정보 파일 등록

---

## 2. 불필요한 파일 정리

- [ ] README, design-guide 등 개발 문서 배포 패키지에서 제외
- [ ] `secrets.example.js` 패키징 단계에서 제외
- [ ] 테스트/임시 파일(`archive/`, `quick-test.html`) 배포 대상에서 제거
- [x] 중복 아이콘 파일 정리 완료
- [x] 불필요한 SVG 파일 제거 완료
- [x] "untitled folder" 등 임시 폴더 정리 완료

---

## 3. 파일명 및 경로 확인

- [x] 모든 파일명에 특수문자, 공백, 한글 없음 확인
- [x] `manifest.json` 경로와 실제 파일 경로 일치 확인

---

## 4. manifest.json 점검

- [x] `name`, `version`, `description` 메타데이터 정확히 입력
- [x] permissions 최소화
- [x] 불필요한 권한, host permissions 제거
- [x] `background`, `content_scripts`, `icons` 경로 정확히 지정
- **현재 버전**: 1.1

---

## 5. 코드 최적화 및 보안

- [ ] 주요 코드 난독화/최적화 (선택사항)
- [ ] **콘솔 로그/디버깅 코드 제거** (현재 33개 이상 존재)
- [x] 외부 라이브러리 라이선스 확인

---

## 6. UI/UX 점검

- [x] `popup.html`, CSS 정상 동작 확인
- [x] 아이콘, 레이아웃, 반응형 테스트 완료

---

## 7. 기능 테스트

- [x] 주요 기능(백그라운드, 컨텐츠, 팝업) 정상 동작 확인
- [ ] 다양한 환경(Windows, Mac, Linux, 최신 브라우저) 테스트

---

## 8. 크롬 웹스토어 심사 대응

- [x] 개인정보 처리방침 초안 작성 (`docs/privacy-policy.html`)
- [ ] 확장 프로그램 설명, 스크린샷, 아이콘 등 스토어 등록 자료 준비

---

## 9. API 키 보안

- [x] Chrome 내장 LanguageModel API만 사용 → 외부 LLM 키 의존성 없음
- [ ] Google Calendar OAuth 외 추가 API 키 노출 여부 재점검
- [ ] 서버 프록시 필요 시 인프라 및 인증 방식 결정

---

## 10. Chrome Built-in AI 전환 (해커톤 참가용)

### AI API 적용
- [x] Groq API 제거 및 Chrome 내장 AI 교체 완료
- [ ] Prompt API 사용 여부 검토 (현재 LanguageModel 직접 호출 중)
- [ ] 서버 의존성 완전 제거 항목 문서화

### 영어 버전 기본화
- [x] 기본 locale = en
- [x] 모든 UI 텍스트 영어 기본값 유지
- [x] 팝업 메뉴, 버튼, 메시지 영어화 완료
- [x] 에러 메시지, 토스트 알림 영어화 확인
- [x] 사용자 가이드 영어 버전(README.md) 준비

### 해커톤 제출 준비
- [x] 프로젝트명: Schedule Ninja
- [ ] 라이선스 추가
- [ ] 작동하는 데모 링크/영상 준비 (3분 이내)
- [ ] GitHub 저장소 정리 및 오픈

---

## 11. 향후 기능 계획

- [ ] **사용자 데이터 수집**: 예매 사이트 URL 수동 등록 기능
- [ ] **DB 구축 여부**: MVP 후 사용자 반응 보고 결정
  - 옵션 1: DB 없이 단순 URL 목록 관리
  - 옵션 2: DB 구축하여 사용자 통계 및 피드백 수집

---

## 12. 아이디어

- [ ] 저장 완료 시 자동으로 모달 닫기?
- [ ] 최근 저장된 이벤트 히스토리 기능

---

## 📦 배포 패키지 제외 목록

배포 시 다음 파일/폴더는 제외해야 합니다:

```
# 개발 문서
docs/
AGENTS.md
CLAUDE.md
*.md (README 제외)

# 테스트 파일
tests/
archive/
quick-test.html

# 개발 설정
.git/
.github/
.cursor/
.claude/
.gemini/
.env

# 예시 파일
secrets.example.js
```

---

## ✅ 최종 점검

배포 전 반드시 확인:

1. [ ] `npm run build` 또는 패키징 스크립트 실행
2. [ ] 생성된 `.zip` 파일 압축 해제 후 테스트
3. [ ] Chrome 웹스토어 개발자 대시보드에 업로드
4. [ ] 심사 대기 (보통 1-3일)
