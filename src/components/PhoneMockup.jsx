import React from "react";

const PhoneMockup = ({ children, className = "" }) => (
  <div
    className={`relative mx-auto ${className}`}
    style={{
      background: "linear-gradient(145deg, #1a1a2e 0%, #0f0f1a 100%)",
      borderRadius: "1.6rem",
      border: "1.5px solid rgba(255,255,255,0.10)",
      boxShadow:
        "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
      padding: "8px 6px 8px",
      overflow: "hidden",
    }}
  >
    {/* Status bar */}
    <div className="flex items-center justify-between px-3 pb-1.5 text-[7px] text-white/35 font-medium">
      <span>9:41</span>
      {/* Dynamic Island */}
      <div
        className="rounded-full"
        style={{
          width: 48,
          height: 14,
          background: "#000",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      />
      {/* Battery + signal */}
      <div className="flex items-center gap-0.5">
        <div className="flex gap-[1.5px]">
          {[8, 10, 12, 14].map((h, i) => (
            <div
              key={i}
              className="rounded-sm"
              style={{ width: 2, height: h * 0.4, background: "rgba(255,255,255,0.3)" }}
            />
          ))}
        </div>
        <div
          className="rounded-sm ml-0.5"
          style={{
            width: 14,
            height: 7,
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 2,
            position: "relative",
          }}
        >
          <div
            className="absolute top-[1px] left-[1px] bottom-[1px] rounded-sm"
            style={{ width: "60%", background: "rgba(255,255,255,0.3)" }}
          />
        </div>
      </div>
    </div>

    {/* Screen content */}
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "rgba(0,0,0,0.5)",
        minHeight: 160,
      }}
    >
      {children}
    </div>

    {/* Home indicator */}
    <div className="flex justify-center pt-1.5 pb-0.5">
      <div
        className="rounded-full"
        style={{ width: 32, height: 3, background: "rgba(255,255,255,0.15)" }}
      />
    </div>
  </div>
);

export default PhoneMockup;
