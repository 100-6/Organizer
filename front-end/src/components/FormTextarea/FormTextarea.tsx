import './FormTextarea.css'

interface FormTextareaProps {
  label: string
  id: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  rows?: number
}

const FormTextarea = ({
  label,
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  rows = 3
}: FormTextareaProps) => {
  return (
    <div className="form-textarea-group">
      <label htmlFor={id} className="form-textarea-label">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        className="form-textarea"
      />
    </div>
  )
}

export default FormTextarea