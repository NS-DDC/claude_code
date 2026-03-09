package com.namsik93.fortune;

import android.os.Bundle;
import android.app.AlertDialog;
import android.util.Log;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "SajuMBTI";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        try {
            Log.i(TAG, "onCreate starting...");
            super.onCreate(savedInstanceState);
            Log.i(TAG, "onCreate completed successfully");
        } catch (Throwable t) {
            Log.e(TAG, "Fatal error in onCreate", t);
            showErrorDialog("onCreate", t);
        }
    }

    @Override
    public void onStart() {
        try {
            super.onStart();
        } catch (Throwable t) {
            Log.e(TAG, "Fatal error in onStart", t);
            showErrorDialog("onStart", t);
        }
    }

    @Override
    public void onResume() {
        try {
            super.onResume();
        } catch (Throwable t) {
            Log.e(TAG, "Fatal error in onResume", t);
            showErrorDialog("onResume", t);
        }
    }

    private void showErrorDialog(String phase, Throwable t) {
        try {
            String message = "Phase: " + phase + "\n\n"
                + "Error: " + t.getClass().getSimpleName() + "\n"
                + t.getMessage();

            Log.e(TAG, "===== CRASH REPORT =====");
            Log.e(TAG, "Phase: " + phase);
            Log.e(TAG, "Error: " + t.getClass().getName());
            Log.e(TAG, "Message: " + t.getMessage());
            Log.e(TAG, "Stack:", t);

            new AlertDialog.Builder(this)
                .setTitle("앱 오류 (" + phase + ")")
                .setMessage(message)
                .setPositiveButton("재시도", (dialog, which) -> {
                    recreate();
                })
                .setNegativeButton("종료", (dialog, which) -> {
                    finishAffinity();
                })
                .setCancelable(false)
                .show();
        } catch (Throwable dialogError) {
            Log.e(TAG, "Failed to show error dialog", dialogError);
            try {
                Toast.makeText(this, "앱 시작 실패: " + t.getMessage(), Toast.LENGTH_LONG).show();
            } catch (Throwable toastError) {
                Log.e(TAG, "Even toast failed", toastError);
            }
            finishAffinity();
        }
    }
}
