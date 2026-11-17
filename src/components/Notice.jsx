export default function Notice({ children, className = '' }) {
  return (
    <p className={`notice ${className}`}>
      <span className="notice__icon" aria-hidden="true">
        i
      </span>
      <span>{children}</span>
    </p>
  )
}
