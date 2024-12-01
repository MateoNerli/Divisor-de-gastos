interface PaidBySelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  people: { id: string; name: string }[];
}

function PaidBySelector({
  label,
  value,
  onChange,
  people,
}: PaidBySelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="py-2 pl-2 pr-4 border mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="">Persona que pago</option>
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default PaidBySelector;
