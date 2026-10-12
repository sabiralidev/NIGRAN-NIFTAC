import { useEffect, useRef, useState } from "react";
import { Calendar, Check, ChevronDown } from "lucide-react";
import { RANGE_PRESETS, makePresetRange, makeCustomRange } from "../../utils/timeRange";

const GROUPS = ["Hours", "Days", "Months"];

// Format a Date for a <input type="datetime-local"> value (local time, no seconds).
const toLocalInput = (date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};

const TimeRangeControl = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [customError, setCustomError] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Seed the custom inputs from the active range when opening.
  useEffect(() => {
    if (open && value?.start && value?.end) {
      setCustomStart(toLocalInput(value.start));
      setCustomEnd(toLocalInput(value.end));
      setCustomError("");
    }
  }, [open, value]);

  const pickPreset = (key) => {
    onChange(makePresetRange(key));
    setOpen(false);
  };

  const applyCustom = () => {
    if (!customStart || !customEnd) {
      setCustomError("Pick both a start and end.");
      return;
    }
    const start = new Date(customStart);
    const end = new Date(customEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setCustomError("Those dates aren’t valid.");
      return;
    }
    if (start >= end) {
      setCustomError("Start must be before end.");
      return;
    }
    onChange(makeCustomRange(start, end));
    setOpen(false);
  };

  const label = value?.key === "custom"
    ? `${value.start.toLocaleDateString([], { month: "short", day: "numeric" })} - ${value.end.toLocaleDateString([], { month: "short", day: "numeric" })}`
    : (value?.label || "Last 7 days");

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="hero-control hero-control-primary group transition-all duration-150 hover:border-blue-200 hover:shadow-sm"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 transition-colors group-hover:bg-blue-100">
            <Calendar size={13} className="text-blue-600" />
          </div>
          <span className="text-sm font-semibold text-slate-700">{label}</span>
        </span>
        <ChevronDown
          size={15}
          className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-white shadow-lift ring-1 ring-black/[0.02]">
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {GROUPS.map((group) => (
              <div key={group} className="mb-1">
                <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {group}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {RANGE_PRESETS.filter((p) => p.group === group).map((p) => {
                    const active = value?.key === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => pickPreset(p.key)}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                          active
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                            : "text-slate-600 hover:bg-blue-50/70 hover:text-slate-900"
                        }`}
                      >
                        <span>{p.label.replace("Last ", "")}</span>
                        {active && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="mt-2 border-t border-border px-1 pt-3">
              <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Custom range
              </p>
              <div className="space-y-2 px-1">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-medium text-slate-500">From</span>
                  <input
                    type="datetime-local"
                    value={customStart}
                    max={customEnd || undefined}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-medium text-slate-500">To</span>
                  <input
                    type="datetime-local"
                    value={customEnd}
                    min={customStart || undefined}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                {customError && <p className="text-[11px] text-red-600">{customError}</p>}
                <button
                  type="button"
                  onClick={applyCustom}
                  className="btn-primary w-full py-2 text-sm transition-transform duration-150 hover:-translate-y-0.5"
                >
                  Apply range
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeRangeControl;