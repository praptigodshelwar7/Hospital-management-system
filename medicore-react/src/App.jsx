import { useState, useEffect, useCallback, useRef } from "react";

const API_URL = "http://localhost:8080/api/patients";
const TOTAL_BEDS = 30;

// ─── Colour tokens (matches original JavaFX palette) ──────────────────────────
const C = {
  bg:       "#060d1a",
  bg2:      "#091224",
  card:     "#0d1b2e",
  border:   "#1a2f4a",
  borderHl: "#2a4a70",
  tMain:    "#e8f0fe",
  tSub:     "#5a7a99",
  tDim:     "#2d4a66",
  blue:     "#1a6ef5",
  blueD:    "#1255cc",
  blueG:    "#4d94ff",
  red:      "#e03a3a",
  redD:     "#b82a2a",
  redG:     "#ff6b6b",
  green:    "#10d67e",
  amber:    "#f59e0b",
  icuBg:    "#1f0a0a",
  icuBdr:   "#c53030",
  icuName:  "#fc8181",
  genBg:    "#071628",
  genBdr:   "#2563eb",
  genName:  "#7eb8f7",
  freeBg:   "#04160e",
  freeBdr:  "#0d9466",
  freeName: "#34d399",
};

// ─── Utility ──────────────────────────────────────────────────────────────────
const line = (ch, n) => ch.repeat(n);
const fmtNum = (n) => {
  const parsed = parseInt(n);
  return isNaN(parsed) ? (n || "0") : parsed.toLocaleString("en-IN");
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function BedCell({ bed, patient, onClickOccupied }) {
  const [hovered, setHovered] = useState(false);
  const occupied = !!patient;
  const isICU    = patient?.ward === "ICU";

  const bg     = !occupied ? C.freeBg  : isICU ? C.icuBg  : C.genBg;
  const border = !occupied ? C.freeBdr : isICU ? C.icuBdr : C.genBdr;
  const nameColor = !occupied ? C.freeName : isICU ? C.icuName : C.genName;

  const displayName = occupied
    ? (patient.name.length > 13 ? patient.name.slice(0, 12) + "…" : patient.name)
    : "Available";

  return (
    <div
      title={occupied ? `${patient.name} — ${patient.ward}` : `Bed ${bed} — Available`}
      onClick={() => occupied && onClickOccupied(patient.name)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: `linear-gradient(135deg, ${bg}, ${bg === C.freeBg ? "#051a0e" : isICU ? "#2a0606" : "#0a1c38"})`,
        border: `1px solid ${hovered && occupied ? border : border + "99"}`,
        borderRadius: 10,
        padding: "7px 6px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: occupied ? "pointer" : "default",
        transition: "transform 0.1s, border-color 0.15s",
        transform: hovered ? (occupied ? "scale(1.07)" : "scale(1.03)") : "scale(1)",
        boxShadow: occupied && hovered
          ? `0 0 14px ${border}55`
          : occupied
          ? `0 0 6px ${border}33`
          : "none",
        minWidth: 80,
        minHeight: 58,
        flex: 1,
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 700, color: C.tDim, letterSpacing: 0.5 }}>
        Bed {bed}
      </span>
      <span style={{ fontSize: 11, fontWeight: 700, color: nameColor, marginTop: 2 }}>
        {displayName}
      </span>
      {occupied && (
        <span style={{ fontSize: 9, color: C.tSub, marginTop: 1 }}>{patient.ward}</span>
      )}
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label style={{
      fontSize: 9, fontWeight: 700, color: C.tDim,
      letterSpacing: 1.2, textTransform: "uppercase",
      marginBottom: 4, display: "block",
    }}>
      {children}
    </label>
  );
}

function StyledInput({ value, onChange, placeholder, type = "text", disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        boxSizing: "border-box",
        background: "#07111e",
        color: C.tMain,
        border: `1px solid ${focused ? C.blueG : C.border}`,
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 13,
        outline: "none",
        transition: "border-color 0.15s",
        fontFamily: "inherit",
      }}
    />
  );
}

function ActionButton({ children, onClick, gradient, hoverGradient, glowColor, disabled }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        background: hovered && !disabled ? hoverGradient : gradient,
        color: "white",
        fontWeight: 700,
        fontSize: 13,
        borderRadius: 9,
        padding: "12px 0",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "transform 0.1s, box-shadow 0.15s, background 0.15s",
        transform: hovered && !disabled ? "scale(1.015)" : "scale(1)",
        boxShadow: hovered && !disabled ? `0 0 20px ${glowColor}55` : "none",
        opacity: disabled ? 0.5 : 1,
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

function SectionTitle({ children, color = C.tSub }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, color,
      letterSpacing: 1.5, textTransform: "uppercase",
    }}>
      {children}
    </span>
  );
}

function GradientLine({ a, b }) {
  return (
    <div style={{
      height: 1,
      background: `linear-gradient(to right, ${a}, ${b} 50%, transparent)`,
      margin: "6px 0",
    }} />
  );
}

function Card({ children, style = {} }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: `linear-gradient(to bottom, ${C.card}, ${C.bg2})`,
        borderRadius: 14,
        border: `1px solid ${hovered ? C.borderHl : C.border}`,
        padding: 18,
        transition: "border-color 0.2s",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function WardToggle({ value, onChange }) {
  const wards = [
    { id: "ICU",     label: "🏥  ICU",     sub: "₹1,000/hr", activeColor: C.red,  activeBdr: C.icuBdr, activeText: C.icuName },
    { id: "General", label: "🛏  General", sub: "₹500/hr",   activeColor: C.blue, activeBdr: C.genBdr, activeText: C.genName },
  ];
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {wards.map(w => {
        const active = value === w.id;
        return (
          <button
            key={w.id}
            onClick={() => onChange(w.id)}
            style={{
              flex: 1,
              background: active
                ? `linear-gradient(135deg, ${w.activeColor}cc, ${w.activeColor}88)`
                : "#070e1c",
              color: active ? w.activeText : C.tSub,
              fontWeight: active ? 700 : 400,
              fontSize: 12,
              borderRadius: 9,
              border: `1px solid ${active ? w.activeBdr : C.border}`,
              padding: "9px 14px",
              cursor: "pointer",
              transition: "all 0.15s",
              boxShadow: active ? `0 0 10px ${w.activeBdr}55` : "none",
              fontFamily: "inherit",
              lineHeight: 1.4,
            }}
          >
            {w.label}<br />
            <span style={{ fontSize: 10 }}>{w.sub}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [patients,       setPatients]       = useState([]);
  const [apiStatus,      setApiStatus]      = useState("connecting");
  const [busy,           setBusy]           = useState(false);
  const [output,         setOutput]         = useState(`MediCore HMS ready.  API → ${API_URL}\nLoading bed status…`);
  const outputRef = useRef(null);

  // Admit form
  const [aName, setAName]   = useState("");
  const [aAge,  setAAge]    = useState("");
  const [aWard, setAWard]   = useState("ICU");
  const [aDiag, setADiag]   = useState("");

  // Discharge form
  const [dPatient, setDPatient] = useState("");
  const [dHours,   setDHours]   = useState("");
  const [dInfo,    setDInfo]    = useState("← Click a bed or select above");

  // Responsive grid columns
  const [cols, setCols] = useState(6);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setCols(w < 560 ? 2 : w < 720 ? 3 : w < 900 ? 4 : w < 1060 ? 5 : 6);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  // ── Fetch
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setPatients(Array.isArray(data) ? data : []);
        setApiStatus("online");
      } else {
        setApiStatus("offline");
      }
    } catch {
      setApiStatus("offline");
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  // Build bed map
  const bedMap = {};
  patients.forEach(p => { if (p.bedNumber) bedMap[Number(p.bedNumber)] = p; });

  // ── Admit
  const handleAdmit = async () => {
    if (busy) return;
    const name = aName.trim();
    const diag = aDiag.trim();
    if (!name) { setOutput("⚠  Patient name is required."); return; }
    if (name.length > 80) { setOutput("⚠  Name too long (max 80 chars)."); return; }

    let age = null;
    if (aAge.trim()) {
      age = parseInt(aAge.trim());
      if (isNaN(age) || age < 0 || age > 150) { setOutput("⚠  Age must be a number 0–150."); return; }
    }

    const body = { name, ward: aWard, hours: 0, ...(age !== null && { age }), ...(diag && { diagnosis: diag }) };
    setBusy(true);
    setOutput("⏳  Connecting to server…");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 201) {
        const data = await res.json();
        setOutput(
          `✅  PATIENT ADMITTED\n${line("═", 32)}\nName      : ${name}\nAge       : ${age ?? "—"}\nWard      : ${aWard}\nBed No.   : ${data.bedNumber ?? "—"}\nDiagnosis : ${diag || "—"}\n${line("═", 32)}`
        );
        setAName(""); setAAge(""); setADiag("");
        setApiStatus("online");
        refresh();
      } else {
        const text = await res.text();
        setOutput(`❌  Admit Failed\n\nStatus: ${res.status}\n${text}`);
      }
    } catch (e) {
      setOutput("❌  " + e.message);
      setApiStatus("offline");
    } finally {
      setBusy(false);
    }
  };

  // ── Discharge
  const handleDischarge = async () => {
    if (busy) return;
    if (!dPatient) { setOutput("⚠  Please select a patient."); return; }
    const hrs = parseInt(dHours.trim());
    if (!dHours.trim()) { setOutput("⚠  Please enter hours stayed."); return; }
    if (isNaN(hrs) || hrs <= 0) { setOutput("⚠  Hours must be a positive number."); return; }

    const url = `${API_URL}/${encodeURIComponent(dPatient)}?hours=${hrs}`;
    setBusy(true);
    setOutput("⏳  Connecting to server…");
    try {
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        const d = await res.json();
        const l = line("═", 32);
        setOutput(
          `🏥  DISCHARGE & BILL SUMMARY\n${l}` +
          `\nPatient   : ${d.name}` +
          `\nAge       : ${d.age || "—"}` +
          `\nDiagnosis : ${d.diagnosis || "—"}` +
          `\nBed No.   : ${d.bedNumber}` +
          `\nWard      : ${d.ward}` +
          `\nDuration  : ${hrs} hour${hrs === 1 ? "" : "s"}` +
          `\nRate      : ₹${fmtNum(d.ratePerHr)} / hr` +
          `\n${l}` +
          `\nTotal Bill: ₹${fmtNum(d.totalBill)}` +
          `\n${l}` +
          `\n✅  Discharged. Bed ${d.bedNumber} is now free.`
        );
        setDPatient(""); setDHours(""); setDInfo("← Click a bed or select above");
        setApiStatus("online");
        refresh();
      } else {
        const text = await res.text();
        setOutput(`❌  Discharge Failed\n\nStatus: ${res.status}\n${text}`);
      }
    } catch (e) {
      setOutput("❌  " + e.message);
      setApiStatus("offline");
    } finally {
      setBusy(false);
    }
  };

  // ── Click bed → auto-select in discharge
  const selectFromBed = (name) => {
    setDPatient(name);
    const p = patients.find(pt => pt.name === name);
    if (p) setDInfo(`Age: ${p.age || "—"}  |  Diagnosis: ${p.diagnosis || "—"}`);
  };

  // ── Select from dropdown
  const handleDPatientChange = (name) => {
    setDPatient(name);
    const p = patients.find(pt => pt.name === name);
    setDInfo(p ? `Age: ${p.age || "—"}  |  Diagnosis: ${p.diagnosis || "—"}` : "← Click a bed or select above");
  };

  // ── Status indicator
  const statusColor = apiStatus === "online" ? C.green : apiStatus === "offline" ? "#ef4444" : C.amber;
  const statusText  = apiStatus === "online" ? "API Online" : apiStatus === "offline" ? "API Offline" : "Connecting…";

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', 'SF Pro Display', system-ui, sans-serif", color: C.tMain }}>

      {/* ── Header ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{
          background: "linear-gradient(to bottom, #071428, #060d1a)",
          borderBottom: `1px solid ${C.border}`,
          padding: "14px 22px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}>
          {/* Logo */}
          <span style={{ fontSize: 26, color: C.blueG, lineHeight: 1 }}>✚</span>

          {/* Title */}
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.tMain }}>MediCore HMS</div>
            <div style={{ fontSize: 11, color: C.tSub }}>30-Bed Hospital Management System</div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Status pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#050d1c",
            border: `1px solid ${C.borderHl}`,
            borderRadius: 20, padding: "6px 14px",
          }}>
            <span style={{ fontSize: 9, color: statusColor }}>●</span>
            <span style={{ fontSize: 11, color: statusColor }}>{statusText}</span>
          </div>
        </div>
        {/* Accent bar */}
        <div style={{
          height: 2,
          background: `linear-gradient(to right, transparent, ${C.blue} 25%, ${C.blueG} 50%, ${C.blue} 75%, transparent)`,
        }} />
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "20px", maxWidth: 1200, margin: "0 auto" }}>

        {/* ── Bed Grid Section ── */}
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <SectionTitle>● Bed Overview</SectionTitle>
            <div style={{
              fontSize: 11, color: C.tSub,
              background: "#091828",
              border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "4px 10px",
            }}>
              {patients.length} / {TOTAL_BEDS} beds occupied
            </div>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => { refresh(); }}
              style={{
                background: "#0e1e30",
                color: C.tMain,
                border: `1px solid ${C.border}`,
                borderRadius: 7, padding: "5px 12px",
                fontSize: 11, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ↻ Refresh
            </button>
          </div>
          <GradientLine a={C.blueG} b={C.green} />

          {/* Legend */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            {[
              { label: "Available", bg: C.freeBg, bdr: C.freeBdr, fg: C.freeName },
              { label: "General",   bg: C.genBg,  bdr: C.genBdr,  fg: C.genName  },
              { label: "ICU",       bg: C.icuBg,  bdr: C.icuBdr,  fg: C.icuName  },
            ].map(ch => (
              <div key={ch.label} style={{
                background: ch.bg,
                border: `1px solid ${ch.bdr}`,
                borderRadius: 5, padding: "4px 10px",
                fontSize: 10, fontWeight: 700, color: ch.fg,
              }}>
                {ch.label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 9,
          }}>
            {Array.from({ length: TOTAL_BEDS }, (_, i) => i + 1).map(bed => (
              <BedCell
                key={bed}
                bed={bed}
                patient={bedMap[bed] || null}
                onClickOccupied={selectFromBed}
              />
            ))}
          </div>
        </Card>

        {/* ── Forms ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}>

          {/* Admit Card */}
          <Card>
            <SectionTitle color={C.blueG}>➕ Admit Patient</SectionTitle>
            <GradientLine a={C.blue} b={C.blueG} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
              <div>
                <FieldLabel>Patient Name</FieldLabel>
                <StyledInput value={aName} onChange={setAName} placeholder="e.g. Rajan Mehta" disabled={busy} />
              </div>
              <div>
                <FieldLabel>Age</FieldLabel>
                <StyledInput value={aAge} onChange={setAAge} placeholder="e.g. 45" type="number" disabled={busy} />
              </div>
              <div>
                <FieldLabel>Ward Type</FieldLabel>
                <WardToggle value={aWard} onChange={setAWard} />
              </div>
              <div>
                <FieldLabel>Diagnosis</FieldLabel>
                <StyledInput value={aDiag} onChange={setADiag} placeholder="e.g. Pneumonia" disabled={busy} />
              </div>
              <ActionButton
                onClick={handleAdmit}
                disabled={busy}
                gradient={`linear-gradient(to right, ${C.blueD}, ${C.blue})`}
                hoverGradient={`linear-gradient(to right, ${C.blue}, ${C.blueG})`}
                glowColor={C.blueG}
              >
                ➕  Admit Patient
              </ActionButton>
            </div>
          </Card>

          {/* Discharge Card */}
          <Card>
            <SectionTitle color={C.redG}>🚪 Discharge Patient</SectionTitle>
            <GradientLine a={C.red} b={C.redG} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
              <div>
                <FieldLabel>Select Patient</FieldLabel>
                <select
                  value={dPatient}
                  onChange={e => handleDPatientChange(e.target.value)}
                  disabled={busy}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "#080f1e",
                    color: dPatient ? C.tMain : C.tSub,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 13,
                    outline: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    appearance: "none",
                    WebkitAppearance: "none",
                  }}
                >
                  <option value="" disabled style={{ color: C.tSub }}>
                    Select patient to discharge…
                  </option>
                  {patients.map(p => (
                    <option key={p.name} value={p.name} style={{ color: C.tMain, background: "#080f1e" }}>
                      Bed {p.bedNumber}  ·  {p.name}  ({p.ward})
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient info */}
              <div style={{
                fontSize: 11, color: C.tSub,
                background: "#07111e",
                border: `1px solid ${C.border}`,
                borderRadius: 6, padding: "7px 10px",
                minHeight: 32,
              }}>
                {dInfo}
              </div>

              <div>
                <FieldLabel>Hours Stayed</FieldLabel>
                <StyledInput value={dHours} onChange={setDHours} placeholder="e.g. 48" type="number" disabled={busy} />
              </div>
              <ActionButton
                onClick={handleDischarge}
                disabled={busy}
                gradient={`linear-gradient(to right, ${C.redD}, ${C.red})`}
                hoverGradient={`linear-gradient(to right, ${C.red}, ${C.redG})`}
                glowColor={C.redG}
              >
                🚪  Discharge &amp; Bill
              </ActionButton>
            </div>
          </Card>
        </div>

        {/* ── Output Log ── */}
        <Card>
          <SectionTitle color={C.green}>⚡ Live Output</SectionTitle>
          <GradientLine a={C.green} b={C.blueG} />
          <div
            ref={outputRef}
            style={{
              marginTop: 8,
              background: "#050c18",
              color: "#94d0ff",
              fontFamily: "'Consolas', 'Courier New', monospace",
              fontSize: 12.5,
              border: `1px solid ${C.borderHl}`,
              borderRadius: 8,
              padding: "14px 16px",
              minHeight: 140,
              maxHeight: "20vh",
              overflowY: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              opacity: busy ? 0.45 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {output}
          </div>
        </Card>
      </div>
    </div>
  );
}