import React, { useState, useRef } from "react";
import { ColorTheme } from "../types/theme";

export interface FloatingInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  supportingText?: string;
  type?: string;
  inputMode?: "text" | "numeric" | "tel";
  maxLength?: number;
  colors: ColorTheme;
  scaleSize: (size: number) => number;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  supportingText,
  type = "text",
  inputMode = "text",
  maxLength,
  colors,
  scaleSize,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFloating = isFocused || value.length > 0;

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
  };

  const labelStyle: React.CSSProperties = {
    position: "absolute",
    left: isFloating ? scaleSize(12) : scaleSize(20),
    top: isFloating ? scaleSize(-8) : scaleSize(12),
    fontSize: isFloating ? scaleSize(12) : scaleSize(16),
    fontWeight: 500,
    fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif",
    color: error ? colors.error : isFocused ? colors.labelFocus : colors.label,
    backgroundColor: isFloating ? colors.background : "transparent",
    padding: isFloating ? `0 ${scaleSize(2)}px` : "0",
    transition: "all 200ms ease",
    zIndex: 1,
    pointerEvents: "none",
    lineHeight: isFloating ? `${scaleSize(16.32)}px` : `${scaleSize(22.4)}px`,
    letterSpacing: isFloating ? "-0.12px" : "-0.4px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: scaleSize(48),
    padding: `0 ${scaleSize(20)}px`,
    border: `1px solid ${error ? colors.borderError : isFocused ? colors.borderFocus : colors.border}`,
    borderRadius: scaleSize(8),
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: scaleSize(16),
    fontWeight: 500,
    fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 200ms ease",
  };

  const supportingStyle: React.CSSProperties = {
    fontSize: scaleSize(12),
    fontWeight: 500,
    fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif",
    color: error ? colors.error : colors.label,
    marginTop: scaleSize(4),
    paddingLeft: scaleSize(20),
    paddingRight: scaleSize(20),
    lineHeight: `${scaleSize(16.32)}px`,
    letterSpacing: "-0.12px",
    minHeight: scaleSize(16.32),
    visibility: error || supportingText ? "visible" : "hidden",
  };

  return (
    <div style={containerStyle}>
      <label style={labelStyle}>{label}</label>
      <input
        ref={inputRef}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={isFloating ? placeholder : ""}
        maxLength={maxLength}
        style={inputStyle}
      />
      <p style={supportingStyle}>{error || supportingText || "\u00A0"}</p>
    </div>
  );
};
