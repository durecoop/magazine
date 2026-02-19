// ===== Google Apps Script 코드 =====
// Google Apps Script 에디터(https://script.google.com)에 붙여넣기 하세요.

const SHEET_ID = '여기에_스프레드시트_ID_입력';
const TELEGRAM_BOT_TOKEN = '여기에_봇_토큰_입력';
const TELEGRAM_CHAT_ID = '7237219994';
const DRIVE_FOLDER_ID = '여기에_드라이브_폴더_ID_입력'; // 파일 저장용 폴더

function doPost(e) {
  try {
    const params = e.parameter;
    const teamCode = params.teamCode || '';
    const teamName = params.teamName || '';
    const person = params.person || '';
    const text = params.text || '';
    const now = new Date();
    const dateStr = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');

    // 파일 처리
    let fileUrls = [];
    if (e.parameters && e.parameters.file) {
      // multipart로 올 때
    }
    // Apps Script는 FormData file을 직접 받기 어려우므로 base64 방식도 고려
    // 아래는 contentType이 multipart일 때 blob 처리
    if (e.postData && e.postData.type === 'multipart/form-data') {
      // GAS에서 multipart 파일은 별도 파싱 필요
      // 간단 구현: 텍스트만 먼저 처리
    }

    // 스프레드시트에 기록
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName('자료제출');
    if (!sheet) {
      sheet = ss.insertSheet('자료제출');
      sheet.appendRow(['날짜', '팀코드', '팀명', '담당자', '내용', '파일URL']);
    }
    sheet.appendRow([dateStr, teamCode, teamName, person, text, fileUrls.join('\n')]);

    // 텔레그램 알림
    const msg = `📋 사업보고 자료 접수\n\n👥 ${teamName} (${person})\n📅 ${dateStr}\n\n${text || '(파일만 첨부)'}`;
    sendTelegram(msg);

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // CORS preflight 대응 및 히스토리 조회용
  const teamCode = (e && e.parameter && e.parameter.teamCode) || '';
  if (!teamCode) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'API is running' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  // 팀별 히스토리 반환
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('자료제출');
  if (!sheet) return ContentService.createTextOutput('[]').setMimeType(ContentService.MimeType.JSON);
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1).filter(r => r[1] === teamCode).map(r => ({
    date: r[0], teamName: r[2], person: r[3], text: r[4], files: r[5]
  }));
  return ContentService.createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: 'HTML'
    })
  });
}
