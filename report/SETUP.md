# 🌿 두레생협 사업보고 채팅방 - Firebase 설정 가이드

## 데모 모드 (기본)
Firebase 설정 없이도 localStorage 기반으로 동작합니다.
단, **같은 브라우저에서만** 메시지가 유지됩니다. 실시간 공유는 안 됩니다.

## Firebase 실시간 모드 설정

### 1. Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" → 이름: `dure-report` (아무거나)
3. Google Analytics 비활성화 → 프로젝트 만들기

### 2. Realtime Database 설정
1. 빌드 → Realtime Database → 데이터베이스 만들기
2. 위치: `asia-southeast1` 또는 가까운 곳
3. **테스트 모드**로 시작 (30일간 모든 읽기/쓰기 허용)

### 3. Storage 설정 (파일 업로드용)
1. 빌드 → Storage → 시작하기
2. 테스트 모드로 시작

### 4. 웹 앱 등록
1. 프로젝트 설정 → 일반 → 하단 "웹 앱 추가" (</> 아이콘)
2. 앱 이름: `dure-chat`
3. Firebase SDK config 복사

### 5. index.html에 config 입력
`FIREBASE_CONFIG` 상수를 찾아서 값 입력:
```js
const FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",
  authDomain: "dure-report.firebaseapp.com",
  databaseURL: "https://dure-report-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dure-report",
  storageBucket: "dure-report.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 6. 보안 규칙 (운영 시)
Realtime Database 규칙:
```json
{
  "rules": {
    "report-chat": {
      ".read": true,
      ".write": true
    }
  }
}
```

## 접속 URL
https://durecoop.github.io/magazine/report/

## 기능
- 6팀 실시간 채팅 (Firebase 연결 시)
- 파일 첨부 (5MB 제한)
- 봇 자동 접수 확인
- `/현황` - 제출 현황 확인
- `/취합` - 취합 보고서 생성 (HTML + 엑셀)
- 전체 6팀 접수 시 자동 취합
