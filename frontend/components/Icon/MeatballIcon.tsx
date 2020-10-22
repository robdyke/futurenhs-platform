import React from "react";

interface Props {
  className?: string;
}

export const MeatballIconDark = ({ className }: Props) => (
  <div className={`icon-wrapper ${className || ""}`}>
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17 12a2 2 0 104 0 2 2 0 00-4 0zm-5 2a2 2 0 110-4 2 2 0 010 4zm-7 0a2 2 0 110-4 2 2 0 010 4z"
        fill="currentColor"
      />
    </svg>
  </div>
);

export const MeatballIconLight = ({ className }: Props) => (
  <div className={`icon-wrapper ${className || ""}`}>
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" rx="4" fill="#F0F4F5" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17 12C17 13.1046 17.8954 14 19 14C20.1046 14 21 13.1046 21 12C21 10.8954 20.1046 10 19 10C17.8954 10 17 10.8954 17 12ZM12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14ZM5 14C3.89543 14 3 13.1046 3 12C3 10.8954 3.89543 10 5 10C6.10457 10 7 10.8954 7 12C7 13.1046 6.10457 14 5 14Z"
        fill="#425462"
      />
    </svg>
  </div>
);
