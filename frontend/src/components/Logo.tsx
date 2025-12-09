import { useNavigate } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  clickable?: boolean;
  textColor?: "dark" | "white";
}

const Logo = ({
  size = "md",
  showText = true,
  clickable = true,
  textColor = "dark",
}: LogoProps) => {
  const navigate = useNavigate();

  const sizes: Record<"sm" | "md" | "lg", { icon: string; text: string }> = {
    sm: { icon: "w-6 h-6", text: "text-base" },
    md: { icon: "w-8 h-8", text: "text-xl" },
    lg: { icon: "w-16 h-16", text: "text-3xl" },
  };

  const { icon, text } = sizes[size];

  const handleClick = () => {
    if (clickable) {
      navigate("/");
    }
  };

  return (
    <div
      className={`flex items-center gap-2 ${
        clickable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
      }`}
      onClick={handleClick}
    >
      <svg
        className={icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="6" fill="#000000" />
        <path
          d="M8 11H24M16 11V24M12 16H20"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <span
          className={`${text} font-bold ${
            textColor === "white" ? "text-white" : "text-gray-900"
          } font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif]`}
        >
          TradeForm
        </span>
      )}
    </div>
  );
};

export default Logo;
