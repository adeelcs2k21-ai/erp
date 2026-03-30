@echo off
echo Initializing Git repository...
git init

echo Adding all files...
git add .

echo Committing changes...
git commit -m "first commit"

echo Setting main branch...
git branch -M main

echo Adding remote origin...
git remote add origin https://github.com/adeelcs2k21-ai/erp.git

echo Pushing to GitHub...
git push -u origin main

echo Done!
pause
