import React, { useState, useEffect } from "react";
import { ColorTheme } from "../types/theme";
import { FloatingInput } from "../components/FloatingInput";
import { FloatingSelect } from "../components/FloatingSelect";
import { useScale } from "../hooks/useScale";

// Declare ReactNativeWebView type
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

// ============================================
// 📋 필드 설정 - 여기서 필수/선택을 설정하세요
// ============================================
const FIELD_CONFIG = {
  name: {
    required: true, // 필수 여부
    label: "이름",
    placeholder: "홍길동 또는 John Doe",
    supportingText: "한글 또는 영문으로 입력해주세요",
  },
  gender: {
    required: false, // 필수 여부
    label: "성별",
  },
  birthDate: {
    required: false, // 필수 여부
    label: "생년월일",
    placeholder: "19990101",
    supportingText: "8자리로 입력해주세요. (ex. 19990101)",
  },
  phone: {
    required: false, // 필수 여부
    label: "전화번호",
    placeholder: "010-1234-5678",
  },
} as const;

type FieldName = keyof typeof FIELD_CONFIG;

// 필드가 필수인지 확인
const isFieldRequired = (field: FieldName): boolean => {
  return FIELD_CONFIG[field].required;
};

// 라벨에 (선택) 표시 추가
const getFieldLabel = (field: FieldName): string => {
  const config = FIELD_CONFIG[field];
  return config.required ? config.label : `${config.label} (선택)`;
};

// Gender options
const genderOptions = [
  { label: "남성", value: "male" },
  { label: "여성", value: "female" },
];

interface FormData {
  name: string;
  gender: "male" | "female" | "";
  birthDate: string;
  phone: string;
}

interface FormErrors {
  name?: string;
  gender?: string;
  birthDate?: string;
  phone?: string;
}

const SignupUserinfo: React.FC = () => {
  // Get theme from URL query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const theme = searchParams.get("theme") || "light";
  const isDark = theme === "dark";

  // Use scale hook for responsive sizing
  const { scaleSize } = useScale();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: "",
    gender: "",
    birthDate: "",
    phone: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Progressive field display states
  const [showGenderField, setShowGenderField] = useState(false);
  const [showBirthDateField, setShowBirthDateField] = useState(false);
  const [showPhoneField, setShowPhoneField] = useState(false);

  // Theme-aware colors
  const colors: ColorTheme = {
    background: isDark ? "#1d1d1d" : "#fbfbfb",
    backgroundDisabled: isDark ? "#323232" : "#f4f4f4",
    border: isDark ? "#808080" : "#aeaeae",
    borderFocus: "#007cd4",
    borderError: isDark ? "#e32b1f" : "#df291d",
    text: isDark ? "#fbfbfb" : "#1d1d1d",
    textSecondary: isDark ? "#808080" : "#737373",
    label: isDark ? "#e7e7e7" : "#505050",
    labelFocus: "#007cd4",
    error: isDark ? "#e32b1f" : "#df291d",
    dropdownBorder: isDark ? "#505050" : "#f4f4f4",
    dropdownShadow: isDark ? "rgba(0, 0, 0, 0.5)" : "rgba(207, 207, 207, 0.8)",
  };

  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) return "이름을 입력해주세요";
    if (name.trim().length < 2) return "이름은 2자 이상이어야 합니다";
    const nameRegex = /^[가-힣a-zA-Z\s]+$/;
    if (!nameRegex.test(name)) return "한글 또는 영문만 입력해주세요";
    return undefined;
  };

  // 성별 검증 - required 설정에 따라 다르게 처리
  const validateGender = (gender: string): string | undefined => {
    if (isFieldRequired("gender") && !gender) {
      return "성별을 선택해주세요";
    }
    return undefined;
  };

  // 생년월일 검증 - required 설정에 따라 다르게 처리
  const validateBirthDate = (birthDate: string): string | undefined => {
    // 선택 필드이고 빈 값이면 통과
    if (!isFieldRequired("birthDate") && !birthDate) return undefined;
    // 필수 필드이고 빈 값이면 에러
    if (isFieldRequired("birthDate") && !birthDate) return "생년월일을 입력해주세요";

    // 값이 있으면 형식 검증
    if (birthDate.length !== 8) return "8자리로 입력해주세요";
    const dateRegex = /^\d{8}$/;
    if (!dateRegex.test(birthDate)) return "숫자만 입력해주세요";

    const year = parseInt(birthDate.substring(0, 4));
    const month = parseInt(birthDate.substring(4, 6));
    const day = parseInt(birthDate.substring(6, 8));

    if (year < 1900 || year > new Date().getFullYear()) return "올바른 연도를 입력해주세요";
    if (month < 1 || month > 12) return "올바른 월을 입력해주세요";
    if (day < 1 || day > 31) return "올바른 일을 입력해주세요";

    return undefined;
  };

  // 전화번호 검증 - required 설정에 따라 다르게 처리
  const validatePhone = (phone: string): string | undefined => {
    // 선택 필드이고 빈 값이면 통과
    if (!isFieldRequired("phone") && !phone) return undefined;
    // 필수 필드이고 빈 값이면 에러
    if (isFieldRequired("phone") && !phone) return "전화번호를 입력해주세요";

    // 값이 있으면 형식 검증
    const phoneRegex = /^01[0-9]-\d{4}-\d{4}$/;
    if (!phoneRegex.test(phone)) return "올바른 전화번호 형식이 아닙니다";
    return undefined;
  };

  // Handle input changes
  const handleNameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, name: value }));
    const error = validateName(value);
    setErrors((prev) => ({ ...prev, name: error }));
  };

  const handleGenderChange = (value: string) => {
    setFormData((prev) => ({ ...prev, gender: value as "male" | "female" }));
    const error = validateGender(value);
    setErrors((prev) => ({ ...prev, gender: error }));
  };

  const handleBirthDateChange = (value: string) => {
    const numbersOnly = value.replace(/[^0-9]/g, "").slice(0, 8);
    setFormData((prev) => ({ ...prev, birthDate: numbersOnly }));
    const error = validateBirthDate(numbersOnly);
    setErrors((prev) => ({ ...prev, birthDate: error }));
  };

  const handlePhoneChange = (value: string) => {
    const numbersOnly = value.replace(/[^0-9]/g, "");
    let formatted = numbersOnly;
    if (numbersOnly.length >= 3 && numbersOnly.length <= 7) {
      formatted = `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
    } else if (numbersOnly.length > 7) {
      formatted = `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7, 11)}`;
    }
    setFormData((prev) => ({ ...prev, phone: formatted }));
    const error = validatePhone(formatted);
    setErrors((prev) => ({ ...prev, phone: error }));
  };

  // Progressive field display logic - show all optional fields after name is valid
  useEffect(() => {
    if (formData.name.trim().length >= 2 && !validateName(formData.name)) {
      if (!showGenderField) {
        setTimeout(() => setShowGenderField(true), 100);
      }
      if (!showBirthDateField) {
        setTimeout(() => setShowBirthDateField(true), 200);
      }
      if (!showPhoneField) {
        setTimeout(() => setShowPhoneField(true), 300);
      }
    }
  }, [formData.name, showGenderField, showBirthDateField, showPhoneField]);

  // Get current title based on progress
  const getCurrentTitle = () => {
    if (!showGenderField) return "이름을 입력해주세요";

    // 모든 추가 필드가 선택인 경우
    const allOptional = !isFieldRequired("gender") && !isFieldRequired("birthDate") && !isFieldRequired("phone");

    if (allOptional) {
      return "추가 정보를 입력해주세요";
    }

    return "추가 정보를 입력해주세요";
  };

  // Check if form is valid - FIELD_CONFIG에 따라 필수 필드 검증
  const isFormValid = () => {
    // 이름은 항상 필수
    const nameValid = formData.name.trim().length >= 2 && !validateName(formData.name);

    // 각 필드의 required 설정에 따라 검증
    const genderValid = isFieldRequired("gender") ? !!formData.gender && !validateGender(formData.gender) : !validateGender(formData.gender);

    const birthDateValid = isFieldRequired("birthDate") ? !!formData.birthDate && !validateBirthDate(formData.birthDate) : !validateBirthDate(formData.birthDate);

    const phoneValid = isFieldRequired("phone") ? !!formData.phone && !validatePhone(formData.phone) : !validatePhone(formData.phone);

    return nameValid && genderValid && birthDateValid && phoneValid;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!isFormValid()) return;

    const message = JSON.stringify({
      type: "SIGNUP_USERINFO_SUBMIT",
      data: {
        name: formData.name,
        gender: formData.gender,
        birthDate: formData.birthDate,
        phone: formData.phone,
      },
    });

    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(message);
    } else {
      console.log("Form submitted:", message);
      alert(`회원가입 정보 제출: ${JSON.stringify(formData, null, 2)}`);
    }
  };

  // Styles with scaleSize
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    padding: scaleSize(20),
    paddingTop: scaleSize(55),
    backgroundColor: colors.background,
    boxSizing: "border-box",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: scaleSize(20),
    fontWeight: 700,
    lineHeight: `${scaleSize(26)}px`,
    letterSpacing: "-0.08px",
    color: colors.text,
    marginBottom: scaleSize(20),
    fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const formContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: scaleSize(4),
    minHeight: scaleSize(320),
    position: "relative",
  };

  const fieldContainerStyle = (visible: boolean, index: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateX(0)" : `translateX(${scaleSize(-30)}px)`,
    transition: "opacity 400ms ease, transform 400ms ease",
    transitionDelay: `${index * 100}ms`,
    pointerEvents: visible ? "auto" : "none",
  });

  const buttonContainerStyle: React.CSSProperties = {
    marginTop: "auto",
    paddingTop: scaleSize(32),
    paddingBottom: scaleSize(48),
  };

  const submitButtonStyle: React.CSSProperties = {
    width: "100%",
    height: scaleSize(44),
    padding: `${scaleSize(12)}px 0`,
    fontSize: scaleSize(16),
    fontWeight: 700,
    fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif",
    border: "none",
    borderRadius: scaleSize(8),
    backgroundColor: isFormValid() ? "#007cd4" : colors.backgroundDisabled,
    color: isFormValid() ? "#fbfbfb" : colors.textSecondary,
    cursor: isFormValid() ? "pointer" : "not-allowed",
    transition: "all 150ms ease",
    lineHeight: `${scaleSize(21.76)}px`,
    letterSpacing: "-0.224px",
  };

  return (
    <div style={containerStyle}>
      {/* Dynamic Title */}
      <h1 style={titleStyle}>{getCurrentTitle()}</h1>

      {/* Form Fields */}
      <div style={formContainerStyle}>
        {/* Name Input */}
        <div style={fieldContainerStyle(true, 0)}>
          <FloatingInput
            label={getFieldLabel("name")}
            value={formData.name}
            onChange={handleNameChange}
            placeholder={FIELD_CONFIG.name.placeholder}
            error={errors.name}
            supportingText={FIELD_CONFIG.name.supportingText}
            colors={colors}
            scaleSize={scaleSize}
          />
        </div>

        {/* Gender Select */}
        <div style={fieldContainerStyle(showGenderField, 1)}>
          <FloatingSelect
            label={getFieldLabel("gender")}
            value={formData.gender}
            onChange={handleGenderChange}
            options={genderOptions}
            placeholder=""
            error={errors.gender}
            colors={colors}
            scaleSize={scaleSize}
          />
        </div>

        {/* Birth Date Input */}
        <div style={fieldContainerStyle(showBirthDateField, 2)}>
          <FloatingInput
            label={getFieldLabel("birthDate")}
            value={formData.birthDate}
            onChange={handleBirthDateChange}
            placeholder={FIELD_CONFIG.birthDate.placeholder}
            inputMode="numeric"
            maxLength={8}
            error={errors.birthDate}
            supportingText={FIELD_CONFIG.birthDate.supportingText}
            colors={colors}
            scaleSize={scaleSize}
          />
        </div>

        {/* Phone Input */}
        <div style={fieldContainerStyle(showPhoneField, 3)}>
          <FloatingInput
            label={getFieldLabel("phone")}
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder={FIELD_CONFIG.phone.placeholder}
            inputMode="tel"
            error={errors.phone}
            colors={colors}
            scaleSize={scaleSize}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div style={buttonContainerStyle}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid()}
          style={submitButtonStyle}
          onMouseDown={(e) => {
            if (isFormValid()) {
              (e.target as HTMLButtonElement).style.backgroundColor = "#005cc4";
            }
          }}
          onMouseUp={(e) => {
            if (isFormValid()) {
              (e.target as HTMLButtonElement).style.backgroundColor = "#007cd4";
            }
          }}
          onMouseLeave={(e) => {
            if (isFormValid()) {
              (e.target as HTMLButtonElement).style.backgroundColor = "#007cd4";
            }
          }}
        >
          가입 완료
        </button>
      </div>
    </div>
  );
};

export default SignupUserinfo;
