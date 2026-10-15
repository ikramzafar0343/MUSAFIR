@echo off
cd /d "%~dp0"
rmdir /s /q ".git" 2>nul
if exist ".git" (
  echo Still locked. Close Cursor fully, then run this again.
  exit /b 1
)
echo .git removed. Project has no git repo.
