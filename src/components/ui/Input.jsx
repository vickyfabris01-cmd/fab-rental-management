import { forwardRef, useState } from "react";

// =============================================================================
// Input
//
// Props:
//   label         — string — label above the input
//   error         — string | null — red error message below
//   helper        — string — grey helper text below (hidden when error shows)
//   leftAdornment — ReactNode — icon/text shown inside left edge
//   rightAdornment— ReactNode — icon/text shown inside right edge
//   required      — boolean — adds * to label
//   disabled      — boolean
//   id            — string — auto-generated from label if omitted
//   ...rest       — any native <input> props (type, placeholder, value, onChange…)
//
// Usage:
//   <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} error={errors.email} />
//   <Input label="Search" leftAdornment={<SearchIcon />} placeholder="Search residents…" />
// =============================================================================

const T = {
  border:       "#E8DDD4",
  borderFocus:  "#C5612C",
  borderError:  "#EF4444",
  bg:           "#fff",
  bgDisabled:   "#FAF7F2",
  label:        "#1A1412",
  placeholder:  "#8B7355",
  text:         "#1A1412",
  error:        "#EF4444",
  helper:       "#8B7355",
  ring:         "rgba(197,97,44,0.14)",
};

const Input = forwardRef(function Input(
  {
    label,
    error,
    helper,
    leftAdornment,
    rightAdornment,
    showStrength,   // consumed here, never passed to DOM
    required = false,
    disabled = false,
    id,
    style: extraStyle = {},
    className,
    ...rest
  },
  ref
) {
  const [focused, setFocused] = useState(false);
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  const borderColor = error ? T.borderError : focused ? T.borderFocus : T.border;
  const boxShadow   = error
    ? "0 0 0 3px rgba(239,68,68,0.10)"
    : focused
    ? `0 0 0 3px ${T.ring}`
    : "none";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", ...extraStyle }}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          style={{ fontSize: 13, fontWeight: 600, color: T.label, lineHeight: 1, userSelect: "none" }}
        >
          {label}
          {required && <span style={{ color: T.error, marginLeft: 3 }}>*</span>}
        </label>
      )}

      {/* Input wrapper */}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {/* Left adornment */}
        {leftAdornment && (
          <div style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: focused ? T.borderFocus : T.placeholder,
            display: "flex", alignItems: "center",
            pointerEvents: "none",
            transition: "color 0.15s",
            zIndex: 1,
          }}>
            {leftAdornment}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); rest.onBlur?.(e); }}
          style={{
            width:        "100%",
            padding:      `11px ${rightAdornment ? 40 : 14}px 11px ${leftAdornment ? 38 : 14}px`,
            border:       `1.5px solid ${borderColor}`,
            borderRadius: 12,
            background:   disabled ? T.bgDisabled : T.bg,
            color:        disabled ? T.helper : T.text,
            fontSize:     14,
            fontFamily:   "'DM Sans', system-ui, sans-serif",
            outline:      "none",
            boxShadow,
            transition:   "border-color 0.18s ease, box-shadow 0.18s ease",
            cursor:       disabled ? "not-allowed" : "text",
            opacity:      disabled ? 0.7 : 1,
          }}
          {...rest}
        />

        {/* Right adornment */}
        {rightAdornment && (
          <div style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            display: "flex", alignItems: "center",
            color: focused ? T.borderFocus : T.placeholder,
            transition: "color 0.15s",
          }}>
            {rightAdornment}
          </div>
        )}
      </div>

      {/* Error / helper text */}
      {error && (
        <span id={`${inputId}-error`} role="alert" style={{ fontSize: 12, color: T.error, lineHeight: 1.4, display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </span>
      )}
      {!error && helper && (
        <span id={`${inputId}-helper`} style={{ fontSize: 12, color: T.helper, lineHeight: 1.4 }}>{helper}</span>
      )}
    </div>
  );
});

export default Input;
