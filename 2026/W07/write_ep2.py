#!/usr/bin/env python3
# -*- coding: utf-8 -*-

html = '''<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>이번 설, 이것만은 EP.2 - 온 가족 식탁</title>
</head>
<body>test</body>
</html>'''

path = 'C:/Users/이지원/magazine_temp/2026/W07/ep2-family.html'
with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
print('Done')
