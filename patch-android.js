// cap sync 후 실행: 가로 화면일 때 상태바/내비게이션 바를 숨기는 전체화면(몰입 모드) 적용
const fs = require('fs'), path = require('path');
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
