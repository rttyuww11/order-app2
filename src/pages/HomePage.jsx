import CategoryButton from '../components/CategoryButton.jsx'
import { categories } from '../data/lostItems.js'

const categoryEmojis = {
  텀블러: '🥤',
  의류: '👕',
  기타: '🧩',
}

export default function HomePage({
  onSelectCategory,
  onOpenAdmin,
  largeText,
  onToggleLargeText,
}) {
  return (
    <main className="home-page">
      <div className="display-tools">
        <button
          aria-label={largeText ? '글씨 크기 원래대로' : '글씨 크게 키우기'}
          aria-pressed={largeText}
          className={`font-size-toggle${largeText ? ' is-active' : ''}`}
          onClick={onToggleLargeText}
          title="글씨 크기 키우기"
          type="button"
        >
          가
        </button>
      </div>
      <section className="home-intro">
        <div className="brand">
          <p className="brand__school">순천미래과학고등학교</p>
          <div className="brand__title">
            <svg className="brand__icon" viewBox="0 0 64 64" aria-hidden="true">
              <path d="M8 27 32 9l24 18v29H8V27Z" fill="#DCEBFA" stroke="#315F92" strokeWidth="3" strokeLinejoin="round" />
              <path d="M25 56V37a7 7 0 0 1 14 0v19M15 33h6v7h-6zm28 0h6v7h-6z" fill="#5F8FC0" stroke="#315F92" strokeWidth="2" />
              <path d="M32 9V3m0 1h13l-4 5 4 5H32" fill="#4B80B5" stroke="#315F92" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <h1>교내 분실물 키오스크</h1>
          </div>
        </div>
        <div className="home-intro__copy">
          <h2>잃어버린 물건을 찾아보세요</h2>
          <p>찾고 싶은 물건의 종류를 선택해 주세요</p>
        </div>
      </section>
      <section className="category-list" aria-label="물건 카테고리">
        {categories.map((category) => (
          <CategoryButton
            key={category}
            category={category}
            emoji={categoryEmojis[category]}
            onClick={() => onSelectCategory(category)}
          />
        ))}
      </section>
      <p className="home-footer">분실물을 발견하면 학생부실로 가져와주세요.</p>
      <button className="admin-entry" onClick={onOpenAdmin} type="button">
        관리자
      </button>
    </main>
  )
}
