package com.blumebyte.prosme;

import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;

import com.getcapacitor.BridgeActivity;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdLoader;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.nativead.MediaView;
import com.google.android.gms.ads.nativead.NativeAd;
import com.google.android.gms.ads.nativead.NativeAdView;

public class MainActivity extends BridgeActivity {
    private FrameLayout nativeAdContainer;
    private NativeAd currentNativeAd;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        nativeAdContainer = createNativeAdContainer();

        new Thread(() -> MobileAds.initialize(this, initializationStatus -> runOnUiThread(this::loadNativeAd))).start();
    }

    private FrameLayout createNativeAdContainer() {
        FrameLayout container = new FrameLayout(this);
        container.setVisibility(View.GONE);

        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM
        );
        addContentView(container, params);
        return container;
    }

    private void loadNativeAd() {
        AdLoader adLoader = new AdLoader.Builder(this, getString(R.string.admob_native_ad_unit_id))
                .forNativeAd(nativeAd -> {
                    if (isDestroyed() || isFinishing()) {
                        nativeAd.destroy();
                        return;
                    }
                    if (currentNativeAd != null) {
                        currentNativeAd.destroy();
                    }
                    currentNativeAd = nativeAd;
                    NativeAdView adView = (NativeAdView) getLayoutInflater().inflate(R.layout.native_ad_layout, nativeAdContainer, false);
                    populateNativeAdView(nativeAd, adView);
                    nativeAdContainer.removeAllViews();
                    nativeAdContainer.addView(adView);
                    nativeAdContainer.setVisibility(View.VISIBLE);
                })
                .withAdListener(new AdListener() {
                    @Override
                    public void onAdFailedToLoad(LoadAdError adError) {
                        nativeAdContainer.setVisibility(View.GONE);
                    }
                })
                .build();

        adLoader.loadAd(new AdRequest.Builder().build());
    }

    private void populateNativeAdView(NativeAd nativeAd, NativeAdView adView) {
        MediaView mediaView = adView.findViewById(R.id.ad_media);
        TextView headlineView = adView.findViewById(R.id.ad_headline);
        TextView bodyView = adView.findViewById(R.id.ad_body);
        Button callToActionView = adView.findViewById(R.id.ad_call_to_action);
        ImageView iconView = adView.findViewById(R.id.ad_app_icon);

        adView.setMediaView(mediaView);
        adView.setHeadlineView(headlineView);
        adView.setBodyView(bodyView);
        adView.setCallToActionView(callToActionView);
        adView.setIconView(iconView);

        headlineView.setText(nativeAd.getHeadline());

        if (nativeAd.getBody() == null) {
            bodyView.setVisibility(View.GONE);
        } else {
            bodyView.setText(nativeAd.getBody());
            bodyView.setVisibility(View.VISIBLE);
        }

        if (nativeAd.getCallToAction() == null) {
            callToActionView.setVisibility(View.GONE);
        } else {
            callToActionView.setText(nativeAd.getCallToAction());
            callToActionView.setVisibility(View.VISIBLE);
        }

        if (nativeAd.getIcon() == null) {
            iconView.setVisibility(View.GONE);
        } else {
            iconView.setImageDrawable(nativeAd.getIcon().getDrawable());
            iconView.setVisibility(View.VISIBLE);
        }

        adView.setNativeAd(nativeAd);
    }

    @Override
    public void onDestroy() {
        if (currentNativeAd != null) {
            currentNativeAd.destroy();
            currentNativeAd = null;
        }
        super.onDestroy();
    }
}
