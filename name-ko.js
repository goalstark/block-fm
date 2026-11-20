// 한글 앱 이름: 한국어 기기에서 '블록 풋볼 매니저'로 표시 (기본/영문은 capacitor.config.json 의 appName)
const fs = require('fs'), d = 'android/app/src/main/res/values-ko';
fs.mkdirSync(d, { recursive: true });
fs.writeFileSync(d + '/strings.xml', '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">블록 풋볼 매니저</string>\n    <string name="title_activity_main">블록 풋볼 매니저</string>\n</resources>\n');
console.log('ko app name written');
