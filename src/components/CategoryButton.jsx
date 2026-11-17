export default function CategoryButton({ category, emoji, onClick }) {
  return (
    <button className="category-card" onClick={onClick} type="button">
      <span className="category-card__emoji" aria-hidden="true">{emoji}</span>
      <span>{category}</span>
      <span className="category-card__arrow" aria-hidden="true">
        ›
      </span>
    </button>
  )
}
