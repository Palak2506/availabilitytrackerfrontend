import { useState, useMemo } from "react";
import {
  formatDateLocal,
  formatTimeLocal,
  formatTimeRange,
} from "../utils/time";

/**
 * WeeklyCalendarGrid - Displays a 7-day calendar with hourly time slots
 * 
 * @param {string[]} gridDates - Array of 7 date strings (YYYY-MM-DD)
 * @param {function} isSlotEnabled - Check if slot is available (dateStr, hour) => boolean
 * @param {function} isSlotDisabled - Check if slot is disabled (dateStr, hour) => boolean
 * @param {function} toggleSlot - Toggle slot availability (dateStr, hour) => void
 * @param {string} displayTimezone - Timezone for display (UTC, IST, etc.)
 * @param {boolean} loading - Loading state
 * @param {string} gridStart - First day for week label formatting
 */
export default function WeeklyCalendarGrid({
  gridDates = [],
  isSlotEnabled,
  isSlotDisabled,
  toggleSlot,
  displayTimezone,
  loading,
  gridStart,
}) {
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const [selectedSlots, setSelectedSlots] = useState(new Set());

  // Format time label for display (e.g., "9:00 AM – 10:00 AM")
  const formatTimeOptionLabel = (utcHourIndex) => {
    const startISO = new Date(Date.UTC(2000, 0, 1, utcHourIndex, 0)).toISOString();
    const endISO = new Date(Date.UTC(2000, 0, 1, utcHourIndex + 1, 0)).toISOString();
    const start = formatTimeLocal(startISO, displayTimezone);
    const end = formatTimeLocal(endISO, displayTimezone);
    return formatTimeRange(`${start} – ${end}`);
  };

  // Get day abbreviation (Mon, Tue, etc.)
  const getDayAbbr = (dateStr) => {
    const date = new Date(`${dateStr}T00:00:00Z`);
    return date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  };

  // Get day of month
  const getDayOfMonth = (dateStr) => {
    const date = new Date(`${dateStr}T00:00:00Z`);
    return date.getUTCDate();
  };

  // Check if date is today
  const isToday = (dateStr) => {
    const today = new Date().toISOString().slice(0, 10);
    return dateStr === today;
  };

  // Handle slot toggle with visual feedback
  const handleSlotClick = (dateStr, hour) => {
    if (isSlotDisabled(dateStr, hour)) return;
    
    const key = `${dateStr}-${hour}`;
    const newSelected = new Set(selectedSlots);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedSlots(newSelected);
    toggleSlot(dateStr, hour);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-600 border-t-blue-500 mb-3" />
          <p className="text-slate-400 font-medium">Loading availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Legend */}
      <div className="flex flex-wrap gap-3 items-center text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-blue-600 border border-blue-600" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-slate-800 border border-slate-700" />
          <span>Not Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-slate-800/50 border border-slate-800 opacity-40" />
          <span>Unavailable (Past/Booked)</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        {/* Desktop: Table View */}
        <div className="hidden md:block overflow-x-auto max-h-[70vh] overflow-y-auto">
          <table className="w-full border-collapse">
            {/* Header with dates */}
            <thead className="sticky top-0 bg-slate-950 z-10">
              <tr className="border-b border-slate-800">
                <th className="py-4 px-3 text-left text-slate-400 font-medium text-xs w-24">
                  Time
                </th>
                {gridDates.map((dateStr) => (
                  <th
                    key={dateStr}
                    className={`py-4 px-3 text-center font-medium text-sm min-w-[100px] ${
                      isToday(dateStr) ? "bg-blue-600/20 border-b-2 border-blue-500" : "border-b border-slate-800"
                    }`}
                  >
                    <div className="text-slate-300">{getDayAbbr(dateStr)}</div>
                    <div className={`text-xs font-semibold ${isToday(dateStr) ? "text-blue-400" : "text-slate-400"}`}>
                      {getDayOfMonth(dateStr)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Time slots */}
            <tbody>
              {HOURS.map((hour, hourIdx) => (
                <tr key={hour} className={`border-b border-slate-800 hover:bg-slate-800/30 transition ${
                  hourIdx % 2 === 0 ? "bg-slate-950/50" : ""
                }`}>
                  {/* Time label */}
                  <td className="py-3 px-3 text-slate-400 font-medium text-xs sticky left-0 bg-slate-950/80 whitespace-nowrap">
                    {formatTimeOptionLabel(hour)}
                  </td>

                  {/* Slots for each day */}
                  {gridDates.map((dateStr) => {
                    const enabled = isSlotEnabled(dateStr, hour);
                    const disabled = isSlotDisabled(dateStr, hour);
                    const key = `${dateStr}-${hour}`;
                    const isSelected = selectedSlots.has(key);

                    return (
                      <td key={dateStr} className="p-2">
                        <button
                          type="button"
                          onClick={() => handleSlotClick(dateStr, hour)}
                          disabled={disabled}
                          title={disabled ? "Unavailable (past or booked)" : ""}
                          className={`
                            w-full py-3 px-2 rounded-lg font-medium text-xs transition duration-150 cursor-pointer
                            ${
                              disabled
                                ? "bg-slate-800/50 border border-slate-800 opacity-40 cursor-not-allowed text-slate-600"
                                : enabled
                                ? "bg-blue-600 border border-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/50"
                                : isSelected
                                ? "bg-slate-700 border border-slate-600 text-white hover:bg-slate-600"
                                : "bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-800/80"
                            }
                          `}
                        >
                          {enabled ? "✓" : ""}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: Card View */}
        <div className="md:hidden p-4 space-y-4">
          {gridDates.map((dateStr) => (
            <div key={dateStr} className="border border-slate-800 rounded-lg p-4 bg-slate-950/50">
              {/* Date Header */}
              <div className={`font-semibold text-sm mb-4 pb-3 border-b border-slate-800 ${
                isToday(dateStr) ? "text-blue-400" : "text-white"
              }`}>
                {getDayAbbr(dateStr)}, {getDayOfMonth(dateStr)}
              </div>

              {/* Time slots grid (4 columns) */}
              <div className="grid grid-cols-2 gap-2">
                {HOURS.map((hour) => {
                  const enabled = isSlotEnabled(dateStr, hour);
                  const disabled = isSlotDisabled(dateStr, hour);
                  const key = `${dateStr}-${hour}`;

                  return (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => handleSlotClick(dateStr, hour)}
                      disabled={disabled}
                      title={formatTimeOptionLabel(hour)}
                      className={`
                        py-2 px-2 rounded text-xs font-medium transition
                        ${
                          disabled
                            ? "bg-slate-800/50 border border-slate-800 opacity-40 cursor-not-allowed text-slate-600"
                            : enabled
                            ? "bg-blue-600 border border-blue-600 text-white"
                            : "bg-slate-800 border border-slate-700 text-slate-400"
                        }
                      `}
                    >
                      <span className="text-xs text-slate-300">{hour}:00</span>
                      {enabled && <span className="block text-sm">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Helper text */}
      <div className="text-xs text-slate-500 px-2">
        <p>💡 Click a slot to toggle availability. Save your changes with the "Save Availability" button.</p>
      </div>
    </div>
  );
}
