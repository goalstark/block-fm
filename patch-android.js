// cap sync 후 실행: 가로 화면일 때 상태바/내비게이션 바를 숨기는 전체화면(몰입 모드) 적용
const fs = require('fs'), path = require('path');
const KS = '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';
// 고정 서명 키: 빌드마다 서명이 바뀌면 새 APK를 기존 앱 위에 덮어 설치할 수 없고(저장 데이터가 사라짐) 이를 막기 위해 항상 같은 키로 서명
try {
  const os = require('os'), dir = path.join(os.homedir(), '.android');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'debug.keystore'), Buffer.from(KS, 'base64')); console.log('fixed debug keystore installed');
} catch (e) { console.log('keystore skipped', e.message); }
try {   // gradle 이 홈 폴더 키를 무시하는 경우를 막기 위해 프로젝트 안에 키를 두고 debug 서명 설정을 직접 지정
  const gp = path.join('android', 'app', 'build.gradle'); let g = fs.readFileSync(gp, 'utf8');
  fs.writeFileSync(path.join('android', 'app', 'fixed-debug.keystore'), Buffer.from(KS, 'base64'));
  if (!/fixed-debug\.keystore/.test(g)) {
    g = g.replace(/android\s*\{/, (m) => m + "\n    signingConfigs {\n        debug {\n            storeFile file('fixed-debug.keystore')\n            storePassword 'android'\n            keyAlias 'androiddebugkey'\n            keyPassword 'android'\n        }\n    }");
    fs.writeFileSync(gp, g);
  }
  console.log('gradle debug signing -> fixed keystore');
} catch (e) { console.log('gradle signing patch skipped', e.message); }
try {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const root = path.join('android', 'app', 'src', 'main', 'java');
  if (!fs.existsSync(root)) process.exit(0);
  const f = walk(root).find(x => x.endsWith('MainActivity.java'));
  if (!f) process.exit(0);
  const src = fs.readFileSync(f, 'utf8');
  if (src.includes('applyFs')) process.exit(0);
  const pkg = (src.match(/package\s+([\w.]+);/) || [])[1];
  const out = `package ${pkg};

import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override public void onCreate(Bundle b) { super.onCreate(b); applyFs(); }
  @Override public void onWindowFocusChanged(boolean f) { super.onWindowFocusChanged(f); if (f) applyFs(); }
  @Override public void onConfigurationChanged(Configuration c) { super.onConfigurationChanged(c); applyFs(); }
  private void applyFs() {
    try {
      boolean land = getResources().getConfiguration().orientation == Configuration.ORIENTATION_LANDSCAPE;
      View v = getWindow().getDecorView();
      if (Build.VERSION.SDK_INT >= 28) {
        WindowManager.LayoutParams lp = getWindow().getAttributes();
        lp.layoutInDisplayCutoutMode = land ? WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES : WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_DEFAULT;
        getWindow().setAttributes(lp);
      }
      if (land) v.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
      else v.setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
    } catch (Exception e) { }
  }
}
`;
  fs.writeFileSync(f, out);
  console.log('MainActivity patched: ' + f);
} catch (e) { console.log('patch skipped', e.message); }
