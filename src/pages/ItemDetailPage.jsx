import ItemImage from '../components/ItemImage.jsx'
import { formatDate } from '../components/ItemCard.jsx'
import PageHeader from '../components/PageHeader.jsx'

export default function ItemDetailPage({ item, onHome, onBack }) {
  return (
    <main className="content-page detail-page">
      <PageHeader onHome={onHome} eyebrow={item.category} title="분실물 상세 정보" />
      <section className="detail-card">
        <ItemImage item={item} className="detail-card__image" />
        <div className="detail-card__content">
          <h2>{item.name}</h2>
          <dl className="detail-facts">
            <div>
              <dt>발견 장소</dt>
              <dd>{item.foundLocation}</dd>
            </div>
            <div>
              <dt>발견일</dt>
              <dd>{formatDate(item.foundAt)}</dd>
            </div>
            <div>
              <dt>보관 장소</dt>
              <dd>{item.storageLocation}</dd>
            </div>
            <div className="detail-facts__description">
              <dt>특징</dt>
              <dd>{item.description}</dd>
            </div>
          </dl>
        </div>
      </section>
      <div className="detail-actions">
        <button className="button button--muted" onClick={onBack} type="button">
          목록으로 돌아가기
        </button>
        <button className="button button--primary" onClick={onHome} type="button">
          처음으로
        </button>
      </div>
    </main>
  )
}
