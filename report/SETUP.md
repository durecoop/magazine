# 두레생협 사업보고 공용 채팅방 - 설정 가이드

## 접속 URL
https://durecoop.github.io/magazine/report/

## 사용법
1. 링크 접속 → 자기 팀 선택 → 채팅방 입장
2. 텍스트 입력 또는 파일 첨부로 자료 제출
3. `/현황` 입력하면 제출 현황 확인 가능
4. 봇(십형호 🧠)이 자동으로 접수 확인

## 현재 모드: 로컬 모드 (localStorage)
- 같은 브라우저에서만 메시지 공유됨
- Firebase 연결 시 실시간 멀티유저 채팅 가능

## Firebase 연결 (선택사항)
1. https://console.firebase.google.com 에서 프로젝트 생성
2. Realtime Database 활성화 (테스트 모드)
3. `index.html` 상단의 `FIREBASE_CONFIG` 에 설정값 입력
4. Firebase SDK 스크립트 주석 해제 (파일 하단)

## Google Apps Script 연동
1. https://script.google.com 에서 새 프로젝트 생성
2. `apps-script.js` 내용 붙여넣기
3. `SHEET_ID` → Google Sheets ID 입력
4. `TELEGRAM_BOT_TOKEN` → 텔레그램 봇 토큰 입력
5. 배포 → 웹 앱 → "누구나" 접근 허용
6. 배포 URL을 `index.html`의 `GAS_URL`에 입력

## 팀 정보
| 코드 | 팀명 | 담당자 |
|------|------|--------|
| team01 | 축수산팀 | 상영 |
| team02 | 농산팀 | 정현 |
| team03 | 가공팀 | 기현 |
| team04 | 매장사업팀 | 인서울 |
| team05 | 온라인팀 | 이지원 |
| team06 | 사업상무 | 100상무님 |
