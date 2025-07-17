import React from "react";

interface LogoProps {
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ onClick }) => (
  <h1
    style={{
      margin: 0,
      fontSize: "20px",
      fontWeight: 600,
      cursor: "pointer",
    }}
    onClick={onClick}
  >
    MeetHub
  </h1>
);

export default Logo;
