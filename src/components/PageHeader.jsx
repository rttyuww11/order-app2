export default function PageHeader({ onHome, eyebrow, title }) {
  return (
    <header className="page-header">
      <button className="text-button" onClick={onHome} type="button">
        <span aria-hidden="true">‹</span> 처음으로
      </button>
      <div className="page-header__title-row">
        <div>
          {eyebrow && <p className="page-header__eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
        </div>
      </div>
    </header>
  )
}
