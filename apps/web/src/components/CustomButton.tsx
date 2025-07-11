"use client";

import React from "react";

interface CustomButtonProps {
  type?: "primary" | "default" | "text";
  size?: "small" | "middle" | "large";
  icon?: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  disabled?: boolean;
  block?: boolean;
}

export default function CustomButton({
  type = "default",
  size = "middle",
  icon,
  onClick,
  children,
  style,
  disabled = false,
  block = false,
}: CustomButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    border: "none",
    borderRadius: "6px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 500,
    transition: "all 0.2s ease",
    outline: "none",
    width: block ? "100%" : "auto",
    ...style,
  };

  const sizeStyles = {
    small: {
      padding: "4px 12px",
      fontSize: "14px",
      height: "28px",
    },
    middle: {
      padding: "8px 16px",
      fontSize: "14px",
      height: "32px",
    },
    large: {
      padding: "12px 24px",
      fontSize: "16px",
      height: "40px",
    },
  };

  const typeStyles = {
    primary: {
      backgroundColor: disabled ? "#d9d9d9" : "#1890ff",
      color: "white",
      boxShadow: disabled ? "none" : "0 2px 4px rgba(24, 144, 255, 0.2)",
    },
    default: {
      backgroundColor: disabled ? "#f5f5f5" : "white",
      color: disabled ? "#bfbfbf" : "#262626",
      border: "1px solid #d9d9d9",
    },
    text: {
      backgroundColor: "transparent",
      color: disabled ? "#bfbfbf" : "#1890ff",
      border: "none",
    },
  };

  const hoverStyles = !disabled
    ? {
        primary: {
          backgroundColor: "#40a9ff",
          boxShadow: "0 4px 8px rgba(24, 144, 255, 0.3)",
        },
        default: {
          backgroundColor: "#fafafa",
          borderColor: "#40a9ff",
        },
        text: {
          backgroundColor: "rgba(24, 144, 255, 0.1)",
        },
      }
    : {};

  const [isHovered, setIsHovered] = React.useState(false);

  const buttonStyle: React.CSSProperties = {
    ...baseStyle,
    ...sizeStyles[size],
    ...typeStyles[type],
    ...(isHovered && !disabled ? hoverStyles[type] : {}),
  };

  return (
    <button
      style={buttonStyle}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
    >
      {icon}
      {children}
    </button>
  );
}
