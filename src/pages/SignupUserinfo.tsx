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
// Field configuration - set required/optional here
// ============================================
const FIELD_CONFIG = {
  name: {
    required: true,
    label: { ko: "이름", en: "Name" },
    placeholder: { ko: "홍길동 또는 John Doe", en: "John Doe" },
    supportingText: { ko: "한글 또는 영문으로 입력해주세요", en: "Enter your name in Korean or English" },
  },
  gender: {
    required: false,
    label: { ko: "성별", en: "Gender" },
  },
  birthDate: {
    required: false,
    label: { ko: "생년월일", en: "Date of Birth" },
    placeholder: { ko: "19990101", en: "19990101" },
    supportingText: { ko: "8자리로 입력해주세요. (ex. 19990101)", en: "Enter 8 digits (e.g. 19990101)" },
  },
  phone: {
    required: false,
    label: { ko: "전화번호", en: "Phone Number" },
    placeholder: { ko: "010-1234-5678", en: "010-1234-5678" },
  },
} as const;

type FieldName = keyof typeof FIELD_CONFIG;

// Check if field is required
const isFieldRequired = (field: FieldName): boolean => {
  return FIELD_CONFIG[field].required;
};

// Get label with (optional) suffix
const getFieldLabel = (field: FieldName, isKo: boolean): string => {
  const config = FIELD_CONFIG[field];
  const label = isKo ? config.label.ko : config.label.en;
  if (config.required) return label;
  return isKo ? `${label} (선택)` : `${label} (Optional)`;
};

// Get placeholder
const getPlaceholder = (field: "name" | "birthDate" | "phone", isKo: boolean): string => {
  const config = FIELD_CONFIG[field];
  return isKo ? config.placeholder.ko : config.placeholder.en;
};

// Get supporting text
const getSupportingText = (field: "name" | "birthDate", isKo: boolean): string => {
  const config = FIELD_CONFIG[field];
  return isKo ? config.supportingText.ko : config.supportingText.en;
};

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
  // Get theme and lang from URL query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const theme = searchParams.get("theme") || "light";
  const lang = searchParams.get("lang") || "ko";
  const isDark = theme === "dark";
  const isKo = lang === "ko";

  // Use scale hook for responsive sizing
  const { scaleSize } = useScale();

  // Gender options (language-aware)
  const genderOptions = [
    { label: isKo ? "남성" : "Male", value: "male" },
    { label: isKo ? "여성" : "Female", value: "female" },
  ];

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
    if (!name.trim()) return isKo ? "이름을 입력해주세요" : "Please enter your name";
    if (name.trim().length < 2) return isKo ? "이름은 2자 이상이어야 합니다" : "Name must be at least 2 characters";
    const nameRegex = /^[가-힣a-zA-Z\s]+$/;
    if (!nameRegex.test(name)) return isKo ? "한글 또는 영문만 입력해주세요" : "Only Korean or English characters allowed";
    return undefined;
  };

  const validateGender = (gender: string): string | undefined => {
    if (isFieldRequired("gender") && !gender) {
      return isKo ? "성별을 선택해주세요" : "Please select your gender";
    }
    return undefined;
  };

  const validateBirthDate = (birthDate: string): string | undefined => {
    if (!isFieldRequired("birthDate") && !birthDate) return undefined;
    if (isFieldRequired("birthDate") && !birthDate) return isKo ? "생년월일을 입력해주세요" : "Please enter your date of birth";

    if (birthDate.length !== 8) return isKo ? "8자리로 입력해주세요" : "Please enter 8 digits";
    const dateRegex = /^\d{8}$/;
    if (!dateRegex.test(birthDate)) return isKo ? "숫자만 입력해주세요" : "Numbers only";

    const year = parseInt(birthDate.substring(0, 4));
    const month = parseInt(birthDate.substring(4, 6));
    const day = parseInt(birthDate.substring(6, 8));

    if (year < 1900 || year > new Date().getFullYear()) return isKo ? "올바른 연도를 입력해주세요" : "Please enter a valid year";
    if (month < 1 || month > 12) return isKo ? "올바른 월을 입력해주세요" : "Please enter a valid month";
    if (day < 1 || day > 31) return isKo ? "올바른 일을 입력해주세요" : "Please enter a valid day";

    return undefined;
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!isFieldRequired("phone") && !phone) return undefined;
    if (isFieldRequired("phone") && !phone) return isKo ? "전화번호를 입력해주세요" : "Please enter your phone number";

    const phoneRegex = /^01[0-9]-\d{4}-\d{4}$/;
    if (!phoneRegex.test(phone)) return isKo ? "올바른 전화번호 형식이 아닙니다" : "Invalid phone number format";
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

  // Progressive field display logic
  useEffect(() => {
    const isNameValid = formData.name.trim().length >= 2 && !validateName(formData.name);
    if (isNameValid && !showGenderField) {
      setTimeout(() => setShowGenderField(true), 100);
    }
  }, [formData.name, showGenderField]);

  useEffect(() => {
    if (!showGenderField) return;
    if (formData.gender && !showBirthDateField) {
      setTimeout(() => setShowBirthDateField(true), 100);
    }
  }, [formData.gender, showGenderField, showBirthDateField]);

  useEffect(() => {
    if (!showBirthDateField) return;
    const isBirthDateValid = formData.birthDate.length === 8 && !validateBirthDate(formData.birthDate);
    if (isBirthDateValid && !showPhoneField) {
      setTimeout(() => setShowPhoneField(true), 100);
    }
  }, [formData.birthDate, showBirthDateField, showPhoneField]);

  // Get current title based on progress
  const getCurrentTitle = () => {
    if (!showGenderField) return isKo ? "이름을 입력해주세요" : "Enter your name";
    if (!showBirthDateField) return isKo ? "성별을 선택해주세요" : "Select your gender";
    if (!showPhoneField) return isKo ? "생년월일을 입력해주세요" : "Enter your date of birth";
    return isKo ? "전화번호를 입력해주세요" : "Enter your phone number";
  };

  // Check if form is valid
  const isFormValid = () => {
    const nameValid = formData.name.trim().length >= 2 && !validateName(formData.name);
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
      alert(isKo ? `회원가입 정보 제출: ${JSON.stringify(formData, null, 2)}` : `Signup info submitted: ${JSON.stringify(formData, null, 2)}`);
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
    position: "relative",
    zIndex: 10 - index,
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
            label={getFieldLabel("name", isKo)}
            value={formData.name}
            onChange={handleNameChange}
            placeholder={getPlaceholder("name", isKo)}
            error={errors.name}
            supportingText={getSupportingText("name", isKo)}
            colors={colors}
            scaleSize={scaleSize}
          />
        </div>

        {/* Gender Select */}
        <div style={fieldContainerStyle(showGenderField, 1)}>
          <FloatingSelect
            label={getFieldLabel("gender", isKo)}
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
            label={getFieldLabel("birthDate", isKo)}
            value={formData.birthDate}
            onChange={handleBirthDateChange}
            placeholder={getPlaceholder("birthDate", isKo)}
            inputMode="numeric"
            maxLength={8}
            error={errors.birthDate}
            supportingText={getSupportingText("birthDate", isKo)}
            colors={colors}
            scaleSize={scaleSize}
          />
        </div>

        {/* Phone Input */}
        <div style={fieldContainerStyle(showPhoneField, 3)}>
          <FloatingInput
            label={getFieldLabel("phone", isKo)}
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder={getPlaceholder("phone", isKo)}
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
          {isKo ? "가입 완료" : "Complete Sign Up"}
        </button>
      </div>
    </div>
  );
};

export default SignupUserinfo;
