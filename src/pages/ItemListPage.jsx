import { useMemo, useState } from 'react'
import ItemCard from '../components/ItemCard.jsx'
import PageHeader from '../components/PageHeader.jsx'

const PAGE_SIZE = 3

export default function ItemListPage({
  category,
  items,
  onHome,
  onSelectItem,
}) {
  const [page, setPage] = useState(0)
  const visibleItems = useMemo(
    () =>
      items.filter(
        (item) => item.status === '보관 중' && item.category === category,
      ),
    [category, items],
  )
  const pageCount = Math.ceil(visibleItems.length / PAGE_SIZE)
  const pageItems = visibleItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <main className="content-page item-list-page">
      <PageHeader onHome={onHome} title={category} />
      <p className="item-list-summary">보관 중인 {category} 분실물 목록입니다.</p>
      <p className="item-list-count">
        <strong>{visibleItems.length}</strong>개의 물품
      </p>
      <section className="item-list" aria-label="보관 중인 분실물">
        {pageItems.length > 0 ? (
          pageItems.map((item) => (
            <ItemCard key={item.id} item={item} onClick={() => onSelectItem(item)} />
          ))
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">🔎</span>
            <h2>보관 중인 물건이 없습니다</h2>
            <p>새로운 분실물이 등록되면 이곳에 표시됩니다.</p>
          </div>
        )}
      </section>
      {pageCount > 1 && (
        <nav className="pagination" aria-label="페이지 이동">
          <button
            className="button button--muted"
            disabled={page === 0}
            onClick={() => setPage((current) => current - 1)}
            type="button"
          >
            이전
          </button>
          <span>
            {page + 1} / {pageCount}
          </span>
          <button
            className="button button--primary"
            disabled={page >= pageCount - 1}
            onClick={() => setPage((current) => current + 1)}
            type="button"
          >
            다음
          </button>
        </nav>
      )}
    </main>
  )
}
