// ===== Google Apps Script 코드 =====
// Google Apps Script 에디터(https://script.google.com)에 붙여넣기 하세요.
// 배포: 웹 앱 → 누구나 접근 가능 → 배포 후 URL을 index.html의 GAS_URL에 입력

const SHEET_ID = '여기에_스프레드시트_ID_입력';
const TELEGRAM_BOT_TOKEN = '여기에_봇_토큰_입력';
const TELEGRAM_CHAT_ID = '7237219994';

function doPost(e) {
  try {
    const params = e.parameter;

    // 전체 완료 알림
    if (params.action === 'notifyComplete') {
      sendTelegram('🎉 <b>두레생협 사업보고 전체 접수 완료!</b>\n\n모든 6팀의 자료가 접수되었습니다.\n취합 보고서를 준비해주세요.');
      return jsonResponse({ status: 'ok', action: 'notified' });
    }

    const teamCode = params.teamCode || '';
    const teamName = params.teamName || '';
    const person = params.person || '';
    const text = params.text || '';
    const fileName = params.fileName || '';
    const now = new Date();
    const dateStr = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');

    // 스프레드시트에 기록
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName('사업보고');
    if (!sheet) {
      sheet = ss.insertSheet('사업보고');
      sheet.appendRow(['날짜', '팀코드', '팀명', '담당자', '내용', '첨부파일']);
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#2D5016').setFontColor('white');
    }
    sheet.appendRow([dateStr, teamCode, teamName, person, text || '(파일 첨부)', fileName]);

    // 제출 현황 시트 업데이트
    let statusSheet = ss.getSheetByName('제출현황');
    if (!statusSheet) {
      statusSheet = ss.insertSheet('제출현황');
      statusSheet.appendRow(['팀코드', '팀명', '담당자', '제출일시', '상태']);
      statusSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    }
    // 해당 팀 행 찾기 또는 추가
    const data = statusSheet.getDataRange().getValues();
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === teamCode) {
        statusSheet.getRange(i + 1, 4).setValue(dateStr);
        statusSheet.getRange(i + 1, 5).setValue('✅ 완료');
        found = true;
        break;
      }
    }
    if (!found) {
      statusSheet.appendRow([teamCode, teamName, person, dateStr, '✅ 완료']);
    }

    // 텔레그램 알림
    const msg = `📋 <b>사업보고 자료 접수</b>\n\n👥 ${teamName} — ${person}\n📅 ${dateStr}\n📝 ${text || '(파일 첨부)'}${fileName ? '\n📎 ' + fileName : ''}`;
    sendTelegram(msg);

    return jsonResponse({ status: 'ok' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';

  if (action === 'status') {
    // 제출 현황 반환
    try {
      const ss = SpreadsheetApp.openById(SHEET_ID);
      const sheet = ss.getSheetByName('제출현황');
      if (!sheet) return jsonResponse({ submitted: [] });
      const data = sheet.getDataRange().getValues();
      const submitted = data.slice(1).map(r => r[0]);
      return jsonResponse({ submitted });
    } catch (err) {
      return jsonResponse({ submitted: [], error: err.toString() });
    }
  }

  return jsonResponse({ status: 'ok', message: '두레생협 사업보고 API' });
}

function sendTelegram(text) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN.includes('여기에')) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    });
  } catch (err) {
    console.error('Telegram send failed:', err);
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
