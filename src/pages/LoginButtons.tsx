import React from "react";
import { Button } from "../components/Button";
import { KakaoIcon, GoogleIcon, NaverIcon } from "../components/SocialIcons";
import { useScale } from "../hooks/useScale";

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
  ios: ["kakao", "google", "naver", "email"],
  android: ["kakao", "google", "naver", "email"],
};

const LoginButtons: React.FC = () => {
  // Get platform, theme, and buttons from URL query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const platform = searchParams.get("platform") || "android";
  const theme = searchParams.get("theme") || "light";
  const buttonsParam = searchParams.get("buttons"); // e.g., "kakao,google,naver,email,guest"

  const isDark = theme === "dark";

  // Use scale hook for responsive sizing
  const { scaleSize } = useScale();

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
    justifyContent: "space-between",
    minHeight: "100vh",
    padding: scaleSize(20),
    paddingTop: scaleSize(80),
    paddingBottom: scaleSize(48),
    backgroundColor: colors.background,
    boxSizing: "border-box",
  };

  const logoContainerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    paddingTop: scaleSize(60),
  };

  const logoStyle: React.CSSProperties = {
    width: scaleSize(200),
    height: scaleSize(200),
    objectFit: "contain",
  };

  const buttonsContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: scaleSize(360),
    gap: scaleSize(10),
  };

  const dividerContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: scaleSize(16),
    marginBottom: scaleSize(16),
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
    marginTop: scaleSize(20),
  };

  const guestButtonStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: colors.guestText,
    fontSize: scaleSize(14),
    fontWeight: 500,
    fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif",
    cursor: "pointer",
    padding: scaleSize(8),
  };

  const iconSize = scaleSize(32);

  return (
    <div style={containerStyle}>
      {/* Logo Section */}
      <div style={logoContainerStyle}>
        <img src="/icon.png" alt="ULTRAX Logo" style={logoStyle} />
      </div>

      {/* Buttons Section */}
      <div style={buttonsContainerStyle}>
        {/* Kakao Login Button */}
        {showKakao && (
          <Button
            title="카카오로 시작하기"
            variant="kakao"
            onPress={() => handleButtonClick("kakao")}
            icon={<KakaoIcon width={iconSize} height={iconSize} />}
            iconPosition="left"
            scaleSize={scaleSize}
          />
        )}

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
            scaleSize={scaleSize}
          />
        )}

        {/* Naver Login Button */}
        {showNaver && (
          <Button
            title="네이버로 시작하기"
            variant="naver"
            onPress={() => handleButtonClick("naver")}
            icon={<NaverIcon width={iconSize} height={iconSize} />}
            iconPosition="left"
            scaleSize={scaleSize}
          />
        )}

        {/* Divider - Show only when both social buttons and email button are visible */}
        {showDivider && (
          <div style={dividerContainerStyle}>
            <div style={dividerLineStyle} />
          </div>
        )}

        {/* Email Login Button */}
        {showEmail && <Button title="이메일로 시작하기" variant="assistive" onPress={() => handleButtonClick("email")} isDark={isDark} scaleSize={scaleSize} />}

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
