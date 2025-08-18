//types
import { TextInputProps } from "../types";

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  ...props
}: TextInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="py-2 pl-2 pr-4 border mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}

export default TextInput;
