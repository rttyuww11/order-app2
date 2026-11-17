import ItemImage from './ItemImage.jsx'

export default function ItemCard({ item, onClick }) {
  return (
    <article className="item-card">
      <ItemImage item={item} className="item-card__image" />
      <div className="item-card__content">
        <span className="item-card__category">{item.category}</span>
        <strong className="item-card__name">{item.name}</strong>
        <span className="item-card__hint">분실물 정보를 확인해 주세요</span>
      </div>
      <button
        className="button button--soft item-card__detail"
        onClick={onClick}
        type="button"
        aria-label={`${item.name} 상세 보기`}
      >
        상세 보기 <span aria-hidden="true">→</span>
      </button>
    </article>
  )
}

export function formatDate(date) {
  const [year, month, day] = date.split('-')
  return `${year}년 ${Number(month)}월 ${Number(day)}일`
}
