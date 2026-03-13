import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PortalNew.css";

const STEPS = ["Sender & Recipient", "Package Details", "Choose Carrier", "Review & Pay"];

const CARRIERS = [
  { name: "DHL Express",         service: "Express International", days: "1–3 business days", price: "₦48,200" },
  { name: "FedEx International", service: "Priority International", days: "2–4 business days", price: "₦62,500" },
  { name: "UPS Worldwide",       service: "Saver International",   days: "3–5 business days", price: "₦38,900" },
];

const INITIAL = {
  sName: "", sPhone: "", sAddress: "", sCity: "", sCountry: "Nigeria",
  rName: "", rPhone: "", rAddress: "", rCity: "", rCountry: "",
  weight: "", length: "", width: "", height: "", desc: "", category: "General",
  carrier: "",
};

export default function PortalNew() {
  const navigate = useNavigate();
  const [step,    setStep]    = useState(0);
  const [form,    setForm]    = useState(INITIAL);
  const [done,    setDone]    = useState(false);
  const [newId,   setNewId]   = useState("");

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setCarrier = name => setForm(f => ({ ...f, carrier: name }));

  const next = () => { if (step < 3) setStep(s => s + 1); };
  const back = () => { if (step > 0) setStep(s => s - 1); };

  const confirm = () => {
    const id = "SP-" + (9402 + Math.floor(Math.random() * 100));
    setNewId(id);
    setDone(true);
  };

  const selectedCarrier = CARRIERS.find(c => c.name === form.carrier);

  if (done) {
    return (
      <div className="portal-page">
        <div className="pn-success">
          <div className="pn-success-icon">✅</div>
          <div className="pn-success-title">Shipment Booked!</div>
          <div className="pn-success-id">{newId}</div>
          <div className="pn-success-sub">
            Your shipment has been confirmed. A pickup will be arranged with {form.carrier}.<br />
            Check your email for the label and booking details.
          </div>
          <div className="pn-success-btns">
            <button className="pn-btn-back" onClick={() => navigate("/portal/track?id=" + newId)}>Track Shipment</button>
            <button className="pn-btn-next" onClick={() => navigate("/portal/orders")}>View My Orders →</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-page">
      <div className="portal-page-title">New Shipment</div>
      <div className="portal-page-sub">Book a pickup and get your package delivered worldwide.</div>

      {/* Steps */}
      <div className="pn-steps">
        {STEPS.map((s, i) => (
          <div key={s} className={`pn-step${step === i ? " active" : step > i ? " done" : ""}`}>
            <div className="pn-step-num">{step > i ? "✓" : i + 1}</div>
            <div className="pn-step-label">{s}</div>
          </div>
        ))}
      </div>

      {/* Step 0: Sender & Recipient */}
      {step === 0 && (
        <>
          <div className="pn-section">
            <div className="pn-section-head"><div className="pn-section-icon">📤</div><div className="pn-section-title">Sender Details</div></div>
            <div className="pn-section-body">
              <div className="pn-grid-2" style={{ marginBottom: 16 }}>
                <div className="pn-field"><label className="pn-label">Full Name *</label><input className="pn-input" placeholder="Your name" value={form.sName} onChange={set("sName")} /></div>
                <div className="pn-field"><label className="pn-label">Phone *</label><input className="pn-input" placeholder="+234 800 000 0000" value={form.sPhone} onChange={set("sPhone")} /></div>
              </div>
              <div className="pn-field" style={{ marginBottom: 16 }}><label className="pn-label">Address *</label><input className="pn-input" placeholder="Street address" value={form.sAddress} onChange={set("sAddress")} /></div>
              <div className="pn-grid-2">
                <div className="pn-field"><label className="pn-label">City *</label><input className="pn-input" placeholder="Lagos" value={form.sCity} onChange={set("sCity")} /></div>
                <div className="pn-field"><label className="pn-label">Country</label><select className="pn-select" value={form.sCountry} onChange={set("sCountry")}><option>Nigeria</option><option>Ghana</option><option>Kenya</option></select></div>
              </div>
            </div>
          </div>

          <div className="pn-section">
            <div className="pn-section-head"><div className="pn-section-icon">📥</div><div className="pn-section-title">Recipient Details</div></div>
            <div className="pn-section-body">
              <div className="pn-grid-2" style={{ marginBottom: 16 }}>
                <div className="pn-field"><label className="pn-label">Full Name *</label><input className="pn-input" placeholder="Recipient name" value={form.rName} onChange={set("rName")} /></div>
                <div className="pn-field"><label className="pn-label">Phone *</label><input className="pn-input" placeholder="International format" value={form.rPhone} onChange={set("rPhone")} /></div>
              </div>
              <div className="pn-field" style={{ marginBottom: 16 }}><label className="pn-label">Address *</label><input className="pn-input" placeholder="Street address" value={form.rAddress} onChange={set("rAddress")} /></div>
              <div className="pn-grid-2">
                <div className="pn-field"><label className="pn-label">City *</label><input className="pn-input" placeholder="Destination city" value={form.rCity} onChange={set("rCity")} /></div>
                <div className="pn-field"><label className="pn-label">Country *</label><input className="pn-input" placeholder="e.g. United Kingdom" value={form.rCountry} onChange={set("rCountry")} /></div>
              </div>
            </div>
          </div>
          <div className="pn-btn-row"><button className="pn-btn-next" onClick={next}>Next: Package Details →</button></div>
        </>
      )}

      {/* Step 1: Package */}
      {step === 1 && (
        <>
          <div className="pn-section">
            <div className="pn-section-head"><div className="pn-section-icon">📦</div><div className="pn-section-title">Package Information</div></div>
            <div className="pn-section-body">
              <div className="pn-grid-2" style={{ marginBottom: 16 }}>
                <div className="pn-field"><label className="pn-label">Weight (kg) *</label><input className="pn-input" type="number" placeholder="e.g. 2.5" value={form.weight} onChange={set("weight")} /></div>
                <div className="pn-field"><label className="pn-label">Category</label>
                  <select className="pn-select" value={form.category} onChange={set("category")}>
                    {["General","Documents","Electronics","Clothing","Food","Fragile"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="pn-grid-3" style={{ marginBottom: 16 }}>
                <div className="pn-field"><label className="pn-label">Length (cm)</label><input className="pn-input" type="number" placeholder="30" value={form.length} onChange={set("length")} /></div>
                <div className="pn-field"><label className="pn-label">Width (cm)</label><input className="pn-input"  type="number" placeholder="20" value={form.width}  onChange={set("width")}  /></div>
                <div className="pn-field"><label className="pn-label">Height (cm)</label><input className="pn-input" type="number" placeholder="15" value={form.height} onChange={set("height")} /></div>
              </div>
              <div className="pn-field"><label className="pn-label">Contents Description</label><textarea className="pn-textarea" placeholder="Briefly describe the contents of your package…" value={form.desc} onChange={set("desc")} /></div>
            </div>
          </div>
          <div className="pn-btn-row">
            <button className="pn-btn-back" onClick={back}>← Back</button>
            <button className="pn-btn-next" onClick={next}>Next: Choose Carrier →</button>
          </div>
        </>
      )}

      {/* Step 2: Carrier */}
      {step === 2 && (
        <>
          <div className="pn-section">
            <div className="pn-section-head"><div className="pn-section-icon">🚚</div><div className="pn-section-title">Choose Your Carrier</div></div>
            <div className="pn-section-body">
              <div className="pn-carriers">
                {CARRIERS.map(c => (
                  <div key={c.name} className={`pn-carrier-card${form.carrier === c.name ? " selected" : ""}`} onClick={() => setCarrier(c.name)}>
                    <div className="pn-carrier-name">{c.name}</div>
                    <div className="pn-carrier-service">{c.service}</div>
                    <div className="pn-carrier-price">{c.price}</div>
                    <div className="pn-carrier-days">{c.days}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="pn-btn-row">
            <button className="pn-btn-back" onClick={back}>← Back</button>
            <button className="pn-btn-next" onClick={next} disabled={!form.carrier}>Next: Review →</button>
          </div>
        </>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <>
          <div className="pn-section">
            <div className="pn-section-head"><div className="pn-section-icon">📋</div><div className="pn-section-title">Review Your Shipment</div></div>
            <div className="pn-section-body">
              {[
                ["From",     `${form.sName} · ${form.sCity}, ${form.sCountry}`],
                ["To",       `${form.rName} · ${form.rCity}, ${form.rCountry}`],
                ["Package",  `${form.weight} kg · ${form.category}`],
                ["Carrier",  form.carrier],
                ["Service",  selectedCarrier?.service],
                ["Delivery", selectedCarrier?.days],
                ["Total",    selectedCarrier?.price],
              ].map(([k, v]) => (
                <div key={k} className="pn-summary-row">
                  <div className="pn-summary-key">{k}</div>
                  <div className={`pn-summary-val${k === "Total" ? " pn-summary-total" : ""}`}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="pn-btn-row">
            <button className="pn-btn-back" onClick={back}>← Back</button>
            <button className="pn-btn-next" onClick={confirm}>Confirm & Pay {selectedCarrier?.price} →</button>
          </div>
        </>
      )}
    </div>
  );
}
