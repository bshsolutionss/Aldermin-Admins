"use client";

const fallbackCurrencies = ["PKR", "USD", "AED", "EUR", "GBP", "SAR", "CAD", "AUD", "INR", "CNY", "JPY"];
const currencyCodes = typeof Intl.supportedValuesOf === "function"
  ? Intl.supportedValuesOf("currency")
  : fallbackCurrencies;
const names = new Intl.DisplayNames(["en"], { type: "currency" });

export function SchoolCurrencyField({ value, onChange, disabled = false }: {
  value: string;
  onChange: (currency: string) => void;
  disabled?: boolean;
}) {
  // Preserve an existing backend code even if this browser's ISO list omits it.
  const codes = [...new Set([...currencyCodes, ...(value ? [value] : [])])].sort();
  return (
    <label className="block space-y-2">
      <span>School Currency *</span>
      <select
        required
        aria-label="School Currency"
        aria-describedby="school-currency-help"
        className="block w-full rounded-lg border p-2"
        disabled={disabled}
        value={value}
        onChange={event => onChange(event.target.value)}
      >
        <option value="">Select school currency</option>
        {codes.map(code => <option key={code} value={code}>{code} — {names.of(code) ?? code}</option>)}
      </select>
      <span id="school-currency-help" className="block text-sm text-gray-500">
        Amounts use two decimal places. Currency cannot change after financial amounts are recorded.
      </span>
    </label>
  );
}
