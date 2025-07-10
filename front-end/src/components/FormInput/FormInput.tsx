import './FormInput.css'

interface FormInputProps {
  label: string
  type?: 'text' | 'email' | 'password' | 'date' | 'time' | 'color'
  id: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

const FormInput = ({
  label,
  type = 'text',
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false
}: FormInputProps) => {
  return (
    <div className="form-input-group">
      <label htmlFor={id} className="form-input-label">
        {label}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="form-input"
      />
    </div>
  )
}

export default FormInput