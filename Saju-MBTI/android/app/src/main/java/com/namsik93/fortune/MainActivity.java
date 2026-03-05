package com.namsik93.fortune;

import android.app.AlertDialog;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "SajuMBTI";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        try {
            Log.d(TAG, "MainActivity.onCreate() started");
            super.onCreate(savedInstanceState);
            Log.d(TAG, "MainActivity.onCreate() completed successfully");
        } catch (Exception e) {
            Log.e(TAG, "CRASH in onCreate: " + e.getMessage(), e);
            // 크래시 메시지를 화면에 표시
            try {
                new AlertDialog.Builder(this)
                    .setTitle("앱 오류")
                    .setMessage("오류: " + e.getClass().getSimpleName() + "\n\n" + e.getMessage())
                    .setPositiveButton("확인", (d, w) -> finish())
                    .setCancelable(false)
                    .show();
            } catch (Exception e2) {
                Log.e(TAG, "Failed to show error dialog", e2);
                finish();
            }
        }
    }
}
