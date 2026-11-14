const fs=require('fs'),path=require('path');
const d=__dirname;const R=(f)=>fs.readFileSync(path.join(d,f),'utf8');
const eng='const E=(()=>{const module={};\n'+R('engine2.js')+'\nreturn module.exports;})();';
const js=[eng,R('data.js'),R('stars.js'),R('core.js'),R('ui.js')].join('\n;\n');
const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>BFM</title><style>${R('style.css')}</style></head><body><div id="wrap"><div id="app"></div><div id="modal"></div><div id="match"></div><div id="toast"></div></div><script>\n${js}\n</script></body></html>`;
fs.mkdirSync(path.join(d,'www'),{recursive:true});fs.writeFileSync(path.join(d,'www','index.html'),html);console.log('built',html.length);
