const fs=require('fs'),path=require('path');
const d=__dirname;const R=(f)=>fs.readFileSync(path.join(d,f),'utf8');
const eng='const E=(()=>{const module={};\n'+R('engine2.js')+'\nreturn module.exports;})();';
let js=[eng,R('data.js'),R('stars.js'),R('core.js'),R('ui.js'),R('match3d.js')].join('\n;\n');
// 출시용 난독화: BFM_OBF=1 일 때만(GitHub 빌드). 게임 코드만 바꾸고 three.js(공개 라이브러리)는 그대로 둔다.
// 동작·결과는 같고 읽기 어렵게만 만든다. 속도에 영향이 큰 옵션(제어 흐름 뒤섞기 등)은 끈다.
if(process.env.BFM_OBF==='1'){
  const O=require('javascript-obfuscator');
  js=O.obfuscate(js,{compact:true,simplify:true,target:'browser',seed:20261126,renameGlobals:false,identifierNamesGenerator:'mangled',
    stringArray:false,   // 문자열 숨기기(stringArray)는 시즌 진행을 약 2배 느리게 해서 끔(1시즌 45초→89초, 끄면 46초)
    controlFlowFlattening:false,deadCodeInjection:false,selfDefending:false,debugProtection:false,disableConsoleOutput:false,numbersToExpressions:false,splitStrings:false,transformObjectKeys:false,unicodeEscapeSequence:false}).getObfuscatedCode();
  if(/<\/script/i.test(js))throw new Error('난독화 결과에 </script 가 들어 있음');
  console.log('obfuscated');
}
const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>BFM</title><style>${R('style.css')}</style></head><body><div id="wrap"><div id="app"></div><div id="modal"></div><div id="match"></div><div id="toast"></div></div><script type="text/plain" id="three-src">${R('vendor/three.min.js')}</script><script>\n${js}\n</script></body></html>`;
fs.mkdirSync(path.join(d,'www'),{recursive:true});fs.writeFileSync(path.join(d,'www','index.html'),html);console.log('built',html.length);
