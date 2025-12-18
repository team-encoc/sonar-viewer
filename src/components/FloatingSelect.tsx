import React, { useState, useEffect, useRef } from "react";
import { ColorTheme } from "../types/theme";

export interface FloatingSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  error?: string;
  colors: ColorTheme;
  scaleSize: (size: number) => number;
}

export const FloatingSelect: React.FC<FloatingSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "선택하세요",
  error,
  colors,
  scaleSize,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFloating = isFocused || isOpen || value.length > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

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
    color: error ? colors.error : isFocused || isOpen ? colors.labelFocus : colors.label,
    backgroundColor: isFloating ? colors.background : "transparent",
    padding: isFloating ? `0 ${scaleSize(2)}px` : "0",
    borderRadius: isFloating ? scaleSize(4) : 0,
    transition: "all 200ms ease",
    zIndex: 2,
    pointerEvents: "none",
    lineHeight: isFloating ? `${scaleSize(17.52)}px` : `${scaleSize(22.4)}px`,
    letterSpacing: "-0.24px",
  };

  const selectFieldStyle: React.CSSProperties = {
    width: "100%",
    height: scaleSize(48),
    padding: `${scaleSize(12)}px ${scaleSize(20)}px`,
    border: `1px solid ${error ? colors.borderError : isFocused || isOpen ? colors.borderFocus : colors.border}`,
    borderRadius: scaleSize(8),
    backgroundColor: colors.background,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    boxSizing: "border-box",
    transition: "border-color 200ms ease",
  };

  const valueStyle: React.CSSProperties = {
    fontSize: scaleSize(16),
    fontWeight: 400,
    fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif",
    color: selectedOption ? colors.text : colors.border,
  };

  const arrowStyle: React.CSSProperties = {
    width: scaleSize(12),
    height: scaleSize(12),
    borderLeft: `2px solid ${colors.border}`,
    borderBottom: `2px solid ${colors.border}`,
    transform: isOpen ? "rotate(135deg)" : "rotate(-45deg)",
    transition: "transform 200ms ease",
  };

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: scaleSize(56),
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    border: `1px solid ${colors.dropdownBorder}`,
    borderRadius: scaleSize(8),
    boxShadow: `0 0 ${scaleSize(8)}px ${colors.dropdownShadow}`,
    maxHeight: scaleSize(200),
    overflowY: "auto",
    zIndex: 1000,
  };

  const itemStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: scaleSize(8),
    minHeight: scaleSize(44),
    display: "flex",
    alignItems: "center",
    fontSize: scaleSize(14),
    fontWeight: 500,
    fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif",
    color: colors.text,
    backgroundColor: isSelected ? colors.dropdownBorder : "transparent",
    borderBottom: `1px solid ${colors.dropdownBorder}`,
    cursor: "pointer",
    borderRadius: scaleSize(6),
    margin: scaleSize(2),
  });

  const supportingStyle: React.CSSProperties = {
    fontSize: scaleSize(12),
    fontWeight: 400,
    fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif",
    color: colors.error,
    marginTop: scaleSize(4),
    paddingLeft: scaleSize(20),
    paddingRight: scaleSize(20),
    lineHeight: `${scaleSize(16.32)}px`,
    letterSpacing: "-0.24px",
    minHeight: scaleSize(16.32),
    visibility: error ? "visible" : "hidden",
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      <label style={labelStyle}>{label}</label>
      <div
        style={selectFieldStyle}
        onClick={() => {
          setIsOpen(!isOpen);
          setIsFocused(true);
        }}
      >
        <span style={valueStyle}>{selectedOption ? selectedOption.label : placeholder}</span>
        <div style={arrowStyle} />
      </div>
      {isOpen && (
        <div style={dropdownStyle}>
          {options.map((option, index) => (
            <div
              key={option.value}
              style={{
                ...itemStyle(option.value === value),
                borderBottom: index === options.length - 1 ? "none" : `1px solid ${colors.dropdownBorder}`,
              }}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
                setIsFocused(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
      <p style={supportingStyle}>{error || "\u00A0"}</p>
    </div>
  );
};
