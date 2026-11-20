import { useState } from 'react'
import ItemImage from '../components/ItemImage.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { categories } from '../data/lostItems.js'

const categoryImages = {
  텀블러: '/images/tumbler.svg',
  의류: '/images/clothing.svg',
  기타: '/images/stationery.svg',
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('사진 파일을 읽지 못했습니다. 다시 선택해 주세요.'))
    reader.readAsDataURL(file)
  })
}

function today() {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export default function AdminPage({ items, onHome, onAddItem, onUpdateItem, onDeleteItem }) {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  async function submitItem(event) {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      const form = event.currentTarget
      const formData = new FormData(form)
      const category = formData.get('category')
      const file = formData.get('image')

      if (file.size > 1_500_000) {
        throw new Error('사진은 1.5MB 이하 파일을 선택해 주세요.')
      }

      const item = {
        id: `item-${crypto.randomUUID()}`,
        category,
        name: formData.get('name').trim(),
        imageUrl: file.size ? await readImage(file) : categoryImages[category],
        foundAt: formData.get('foundAt'),
        foundLocation: formData.get('foundLocation').trim(),
        storageLocation: '학생부실',
        description: formData.get('description').trim(),
        status: '보관 중',
      }

      if (await onAddItem(item)) form.reset()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  async function submitEdit(event, item) {
    event.preventDefault()
    setEditError('')
    setEditSaving(true)

    try {
      const formData = new FormData(event.currentTarget)
      const file = formData.get('image')

      if (file.size > 1_500_000) {
        throw new Error('사진은 1.5MB 이하 파일을 선택해 주세요.')
      }

      const updatedItem = {
        ...item,
        category: formData.get('category'),
        name: formData.get('name').trim(),
        imageUrl: file.size ? await readImage(file) : item.imageUrl,
        foundAt: formData.get('foundAt'),
        foundLocation: formData.get('foundLocation').trim(),
        storageLocation: '학생부실',
        description: formData.get('description').trim(),
      }

      if (await onUpdateItem(updatedItem)) setEditingItemId(null)
    } catch (submitError) {
      setEditError(submitError.message)
    } finally {
      setEditSaving(false)
    }
  }

  async function removeItem(item) {
    if (window.confirm(`"${item.name}" 물품을 삭제할까요?`)) {
      setError('')
      try {
        await onDeleteItem(item.id)
      } catch (deleteError) {
        setError(deleteError.message || '분실물을 삭제하지 못했습니다.')
      }
    }
  }

  return (
    <main className="content-page admin-page">
      <PageHeader onHome={onHome} title="관리자 물품 관리" />
      <section className="admin-form-section">
        <h2>분실물 등록</h2>
        <p>물품 정보를 입력하고 사진을 선택해 등록하세요.</p>
        <form className="admin-form" onSubmit={submitItem}>
          <label>
            카테고리
            <select name="category" defaultValue={categories[0]}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            물품 이름
            <input name="name" placeholder="예: 검정색 텀블러" required />
          </label>
          <label>
            발견일
            <input name="foundAt" type="date" defaultValue={today()} required />
          </label>
          <label>
            발견 장소
            <input name="foundLocation" placeholder="예: 도서관" required />
          </label>
          <label className="admin-form__wide">
            특징
            <textarea name="description" placeholder="색상이나 눈에 띄는 특징을 적어 주세요." rows="3" required />
          </label>
          <label className="admin-form__wide">
            물품 사진 <span className="field-note">(선택, 이미지 파일 1.5MB 이하)</span>
            <input name="image" type="file" accept="image/*" />
          </label>
          {error && (
            <p className="form-error admin-form__wide" role="alert">
              {error}
            </p>
          )}
          <button className="button button--primary admin-form__wide" disabled={saving} type="submit">
            {saving ? '등록 중…' : '분실물 등록하기'}
          </button>
        </form>
      </section>
      <section className="admin-items-section">
        <h2>등록된 분실물 <span>{items.length}개</span></h2>
        <div className="admin-item-list">
          {items.map((item) => (
            <article className="admin-item-card" key={item.id}>
              <ItemImage item={item} className="admin-item-card__image" />
              <div className="admin-item-card__info">
                <strong>{item.name}</strong>
                <span>{item.category} · {item.foundLocation}</span>
                <span>보관 장소: {item.storageLocation}</span>
              </div>
              <div className="admin-item-card__actions">
                <button
                  className="button button--muted"
                  onClick={() => {
                    setEditingItemId(item.id)
                    setEditError('')
                  }}
                  type="button"
                >
                  수정
                </button>
                <button
                  className="button button--danger"
                  onClick={() => removeItem(item)}
                  type="button"
                >
                  삭제
                </button>
              </div>
              {editingItemId === item.id && (
                <form className="admin-form admin-item-edit" onSubmit={(event) => submitEdit(event, item)}>
                  <label>
                    카테고리
                    <select name="category" defaultValue={item.category}>
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    물품 이름
                    <input name="name" defaultValue={item.name} required />
                  </label>
                  <label>
                    발견일
                    <input name="foundAt" type="date" defaultValue={item.foundAt} required />
                  </label>
                  <label>
                    발견 장소
                    <input name="foundLocation" defaultValue={item.foundLocation} required />
                  </label>
                  <label className="admin-form__wide">
                    특징
                    <textarea name="description" defaultValue={item.description} rows="3" required />
                  </label>
                  <label className="admin-form__wide">
                    물품 사진 <span className="field-note">(선택, 이미지 파일 1.5MB 이하)</span>
                    <input name="image" type="file" accept="image/*" />
                  </label>
                  {editError && (
                    <p className="form-error admin-form__wide" role="alert">
                      {editError}
                    </p>
                  )}
                  <div className="admin-item-edit__actions admin-form__wide">
                    <button
                      className="button button--muted"
                      onClick={() => setEditingItemId(null)}
                      type="button"
                    >
                      취소
                    </button>
                    <button className="button button--primary" disabled={editSaving} type="submit">
                      {editSaving ? '저장 중…' : '변경 저장'}
                    </button>
                  </div>
                </form>
              )}
            </article>
          ))}
          {items.length === 0 && <p className="admin-empty">등록된 분실물이 없습니다.</p>}
        </div>
      </section>
    </main>
  )
}
