import React from "react";
import { Button } from "../components/Button";
import { KakaoIcon, GoogleIcon, NaverIcon } from "../components/SocialIcons";

// Declare ReactNativeWebView type
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

// Available button types
type ButtonType = "kakao" | "google" | "naver" | "email" | "guest";

// Default buttons for each platform
const DEFAULT_BUTTONS: Record<string, ButtonType[]> = {
  ios: ["email", "guest"],
  android: ["kakao", "google", "naver", "email"],
};

const LoginButtons: React.FC = () => {
  // Get platform, theme, and buttons from URL query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const platform = searchParams.get("platform") || "android";
  const theme = searchParams.get("theme") || "light";
  const buttonsParam = searchParams.get("buttons"); // e.g., "kakao,google,naver,email,guest"

  const isDark = theme === "dark";

  // Parse buttons parameter or use defaults
  const visibleButtons: ButtonType[] = buttonsParam
    ? (buttonsParam.split(",").filter((b) => ["kakao", "google", "naver", "email", "guest"].includes(b)) as ButtonType[])
    : DEFAULT_BUTTONS[platform] || DEFAULT_BUTTONS.android;

  // Check if specific buttons are visible
  const showKakao = visibleButtons.includes("kakao");
  const showGoogle = visibleButtons.includes("google");
  const showNaver = visibleButtons.includes("naver");
  const showEmail = visibleButtons.includes("email");
  const showGuest = visibleButtons.includes("guest");

  // Show divider if any social login button AND email button are both visible
  const hasSocialButtons = showKakao || showGoogle || showNaver;
  const showDivider = hasSocialButtons && showEmail;

  // Send message to React Native WebView
  const handleButtonClick = (provider: string) => {
    const message = JSON.stringify({
      type: "LOGIN_REQUEST",
      provider: provider,
    });

    // Send to React Native WebView
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(message);
    } else {
      // For browser testing
      console.log("Login request:", message);
      alert(`로그인 요청: ${provider}`);
    }
  };

  // Theme-aware colors (matching React Native colorMap)
  const colors = {
    background: isDark ? "#1D1D1D" : "#fbfbfb",
    divider: isDark ? "#505050" : "#aeaeae",
    guestText: "#007cd4", // Primary color stays same
  };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: "100vh",
    padding: "clamp(16px, 5vw, 20px)",
    paddingBottom: "clamp(32px, 10vw, 48px)",
    backgroundColor: colors.background,
    boxSizing: "border-box",
  };

  const buttonsContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "360px",
    gap: "clamp(8px, 2.5vw, 10px)",
  };

  const dividerContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "clamp(12px, 4vw, 16px)",
    marginBottom: "clamp(12px, 4vw, 16px)",
    width: "100%",
  };

  const dividerLineStyle: React.CSSProperties = {
    width: "100%",
    height: "1px",
    backgroundColor: colors.divider,
  };

  const guestButtonContainerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    marginTop: "clamp(16px, 5vw, 20px)",
  };

  const guestButtonStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: colors.guestText,
    fontSize: "clamp(12px, 3.5vw, 14px)",
    fontWeight: 500,
    fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif",
    cursor: "pointer",
    padding: "clamp(6px, 2vw, 8px)",
  };

  const iconSize = 32;

  return (
    <div style={containerStyle}>
      <div style={buttonsContainerStyle}>
        {/* Kakao Login Button */}
        {showKakao && <Button title="카카오로 시작하기" variant="kakao" onPress={() => handleButtonClick("kakao")} icon={<KakaoIcon width={iconSize} height={iconSize} />} iconPosition="left" />}

        {/* Google Login Button */}
        {showGoogle && (
          <Button
            title="구글로 시작하기"
            variant="google"
            style="line"
            onPress={() => handleButtonClick("google")}
            icon={<GoogleIcon width={iconSize} height={iconSize} />}
            iconPosition="left"
            isDark={isDark}
          />
        )}

        {/* Naver Login Button */}
        {showNaver && <Button title="네이버로 시작하기" variant="naver" onPress={() => handleButtonClick("naver")} icon={<NaverIcon width={iconSize} height={iconSize} />} iconPosition="left" />}

        {/* Divider - Show only when both social buttons and email button are visible */}
        {showDivider && (
          <div style={dividerContainerStyle}>
            <div style={dividerLineStyle} />
          </div>
        )}

        {/* Email Login Button */}
        {showEmail && <Button title="이메일로 시작하기" variant="assistive" onPress={() => handleButtonClick("email")} isDark={isDark} />}

        {/* Guest Mode Button */}
        {showGuest && (
          <div style={guestButtonContainerStyle}>
            <button style={guestButtonStyle} onClick={() => handleButtonClick("guest")}>
              게스트 모드
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginButtons;
