@echo off
REM Publish portfolio updates: builds the site, commits and pushes to GitHub (Vercel deploys automatically once connected).
cd /d "%~dp0"
set MSG=%*
if "%MSG%"=="" set MSG=Update portfolio content
node build.js || (echo Build failed - fix the error above. & pause & exit /b 1)
git add -A
git diff --cached --quiet && (echo No changes to publish. & pause & exit /b 0)
git commit -m "%MSG%"
git push
echo Done. Your portfolio will update on Vercel in about a minute.
pause
