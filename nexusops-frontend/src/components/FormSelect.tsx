type SelectOption = {
  value: string;
  label: string;
};

type FormSelectProps = {
  label: string;
  value: string | number;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

function FormSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: FormSelectProps) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default FormSelect;
