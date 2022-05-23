tsc --build --clean
del dist -Force -Recurse
tsc
git add .
git commit -m update
git push