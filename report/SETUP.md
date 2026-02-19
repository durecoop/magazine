# 두레생협 사업보고 자료 제출 시스템 — 설정 가이드

## 1. Google Apps Script 설정

### 1-1. 스프레드시트 생성
1. [Google Sheets](https://sheets.google.com)에서 새 스프레드시트 생성
2. URL에서 스프레드시트 ID 복사 (예: `https://docs.google.com/spreadsheets/d/여기가ID/edit`)

### 1-2. Apps Script 배포
1. [Google Apps Script](https://script.google.com) → 새 프로젝트
2. `apps-script.js` 내용을 `코드.gs`에 붙여넣기
3. 상수 수정:
   - `SHEET_ID` → 스프레드시트 ID
   - `TELEGRAM_BOT_TOKEN` → 텔레그램 봇 토큰
   - `DRIVE_FOLDER_ID` → Google Drive 폴더 ID (파일 저장용)
4. **배포** → **새 배포** → **웹 앱** 선택
   - 실행 주체: **나**
   - 액세스: **모든 사용자**
5. 배포 URL 복사

### 1-3. 프론트엔드 연결
1. `index.html`에서 `%%APPS_SCRIPT_URL%%`을 배포 URL로 교체
   ```
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/xxxxx/exec';
   ```

## 2. 텔레그램 봇 설정
- 이미 설정된 chat_id: `7237219994`
- 봇 토큰은 [@BotFather](https://t.me/BotFather)에서 생성

## 3. 배포
- GitHub Pages: `https://durecoop.github.io/magazine/report/`
- `git push` 후 1-2분 내 반영

## 4. 파일 첨부 참고
- GAS에서 FormData 파일을 직접 받기 어려움
- **대안 A**: 프론트에서 파일을 base64로 변환 후 JSON으로 전송 → GAS에서 Drive에 저장
- **대안 B**: 파일은 별도 Google Form / Drive 링크로 수집
- 현재 구현: 텍스트 우선 처리, 파일은 추후 확장 가능

## 5. 접속
각 팀에게 아래 링크 공유:
```
https://durecoop.github.io/magazine/report/
```
로그인 없이 바로 사용 가능합니다.
