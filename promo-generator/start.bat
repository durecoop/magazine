@echo off
echo ========================================
echo   두레생협 홍보 페이지 생성기
echo ========================================
echo.

cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js가 설치되어 있지 않습니다.
    echo https://nodejs.org 에서 설치해주세요.
    pause
    exit /b
)

if not exist node_modules (
    echo 패키지 설치 중...
    npm install
    echo.
)

echo 서버를 시작합니다...
echo 브라우저에서 http://localhost:3000 을 열어주세요.
echo 종료하려면 이 창을 닫으세요.
echo.
start http://localhost:3000
node server.js
