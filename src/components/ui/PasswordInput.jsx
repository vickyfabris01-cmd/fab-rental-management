import { useState, forwardRef } from "react";
import { validatePassword }     from "../../lib/validators";

// =============================================================================
// PasswordInput
//
// Extends Input with:
//   - Show / hide toggle (eye icon)
//   - Optional password strength meter (4 segments)
//
// Props:
//   label         — string (default "Password")
//   showStrength  — boolean — show strength bar below input
//   error         — string | null
//   helper        — string
//   ...rest       — any <input> props
//
// Usage:
//   <PasswordInput label="New Password" showStrength value={pw} onChange={e => setPw(e.target.value)} />
// =============================================================================

const STRENGTH_META = [
  { label: "Weak",        color: "#EF4444" },
  { label: "Fair",        color: "#F59E0B" },
  { label: "Good",        color: "#3B82F6" },
  { label: "Strong",      color: "#10B981" },
];

// Eye icons
function EyeOpen() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function EyeOff() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

const PasswordInput = forwardRef(function PasswordInput(
  {
    label        = "Password",
    showStrength = false,
    error,
    helper,
    required     = false,
    disabled     = false,
    value        = "",
    onChange,
    id,
    ...rest
  },
  ref
) {
  const [visible,  setVisible]  = useState(false);
  const [focused,  setFocused]  = useState(false);

  // Guard against null/undefined label (some pages omit it or pass null explicitly)
  const inputId  = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : "password-input");
  const strength = showStrength && value ? validatePassword(value) : null;

  const borderColor = error ? "#EF4444" : focused ? "#C5612C" : "#E8DDD4";
  const boxShadow   = error
    ? "0 0 0 3px rgba(239,68,68,0.10)"
    : focused ? "0 0 0 3px rgba(197,97,44,0.14)" : "none";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      {/* Label */}
      {label && (
        <label htmlFor={inputId} style={{ fontSize: 13, fontWeight: 600, color: "#1A1412", lineHeight: 1, userSelect: "none" }}>
          {label}{required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}
        </label>
      )}

      {/* Input + toggle */}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          ref={ref}
          id={inputId}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={!!error}
          onFocus={(e) => { setFocused(true);  rest.onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); rest.onBlur?.(e);  }}
          style={{
            width:        "100%",
            padding:      "11px 44px 11px 14px",
            border:       `1.5px solid ${borderColor}`,
            borderRadius: 12,
            background:   disabled ? "#FAF7F2" : "#fff",
            color:        "#1A1412",
            fontSize:     14,
            fontFamily:   "'DM Sans', system-ui, sans-serif",
            outline:      "none",
            boxShadow,
            transition:   "border-color 0.18s, box-shadow 0.18s",
            cursor:       disabled ? "not-allowed" : "text",
          }}
          {...(() => {
            // Strip any non-DOM props that may have been passed by a parent
            // before spreading onto the native <input> element.
            const { showStrength: _ss, error: _e, helper: _h, ...domProps } = rest;
            return domProps;
          })()}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          style={{
            position:   "absolute", right: 12,
            background: "none", border: "none",
            cursor:     "pointer", padding: 2,
            color:      focused ? "#C5612C" : "#8B7355",
            display:    "flex", alignItems: "center",
            transition: "color 0.15s",
          }}
        >
          {visible ? <EyeOff /> : <EyeOpen />}
        </button>
      </div>

      {/* Strength meter */}
      {showStrength && value && strength && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* 4 segment bar */}
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3, 4].map(seg => (
              <div
                key={seg}
                style={{
                  flex: 1, height: 3, borderRadius: 999,
                  background:  strength.strength >= seg
                    ? STRENGTH_META[strength.strength - 1]?.color ?? "#E8DDD4"
                    : "#E8DDD4",
                  transition: "background 0.3s ease",
                }}
              />
            ))}
          </div>
          {/* Label */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#8B7355" }}>Password strength</span>
            {strength.strength > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: STRENGTH_META[strength.strength - 1]?.color }}>
                {STRENGTH_META[strength.strength - 1]?.label}
              </span>
            )}
          </div>
          {/* Requirement dots */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { key: "length",    label: "8+ chars"   },
              { key: "uppercase", label: "Uppercase"  },
              { key: "number",    label: "Number"     },
              { key: "special",   label: "Symbol"     },
            ].map(req => (
              <span key={req.key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: strength.checks[req.key] ? "#10B981" : "#E8DDD4", flexShrink: 0 }}/>
                <span style={{ color: strength.checks[req.key] ? "#10B981" : "#8B7355" }}>{req.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Error / helper */}
      {error && (
        <span role="alert" style={{ fontSize: 12, color: "#EF4444", lineHeight: 1.4, display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          {error}
        </span>
      )}
      {!error && helper && (
        <span style={{ fontSize: 12, color: "#8B7355", lineHeight: 1.4 }}>{helper}</span>
      )}
    </div>
  );
});

export default PasswordInput;
