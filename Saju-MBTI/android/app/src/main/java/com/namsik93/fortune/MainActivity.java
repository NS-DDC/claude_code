package com.namsik93.fortune;

import android.os.Bundle;
import android.app.AlertDialog;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "SajuMBTI";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        try {
            super.onCreate(savedInstanceState);
            Log.i(TAG, "App started successfully");
        } catch (Exception e) {
            Log.e(TAG, "Fatal error on startup", e);
            showErrorDialog(e);
        }
    }

    private void showErrorDialog(Exception e) {
        try {
            new AlertDialog.Builder(this)
                .setTitle("앱 오류")
                .setMessage("앱 시작 중 오류가 발생했습니다.\n\n" + e.getMessage())
                .setPositiveButton("재시도", (dialog, which) -> {
                    recreate();
                })
                .setNegativeButton("종료", (dialog, which) -> {
                    finishAffinity();
                })
                .setCancelable(false)
                .show();
        } catch (Exception dialogError) {
            Log.e(TAG, "Failed to show error dialog", dialogError);
            finishAffinity();
        }
    }
}
