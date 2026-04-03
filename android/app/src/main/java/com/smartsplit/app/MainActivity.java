package com.smartsplit.app;

import android.os.Bundle;
import android.webkit.CookieManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Allow cross-origin (third-party) cookies so the httpOnly refresh token
        // cookie from the Render backend is stored and sent by the WebView.
        CookieManager.getInstance().setAcceptThirdPartyCookies(
            getBridge().getWebView(), true
        );
    }
}
