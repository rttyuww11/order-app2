import { useState } from 'react'
import AdminPage from './pages/AdminPage.jsx'
import HomePage from './pages/HomePage.jsx'
import ItemDetailPage from './pages/ItemDetailPage.jsx'
import ItemListPage from './pages/ItemListPage.jsx'
import { lostItems } from './data/lostItems.js'

const ITEMS_STORAGE_KEY = 'school-lost-and-found-items'
const LARGE_TEXT_STORAGE_KEY = 'school-lost-and-found-large-text'

function readPreference(key) {
  try {
    return window.localStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

function loadItems() {
  try {
    const savedItems = window.localStorage.getItem(ITEMS_STORAGE_KEY)
    if (!savedItems) return lostItems
    const parsedItems = JSON.parse(savedItems)
    if (!Array.isArray(parsedItems)) throw new Error('분실물 데이터 형식이 올바르지 않습니다.')
    const exampleItems = new Map(lostItems.map((item) => [item.id, item]))
    const normalizedItems = parsedItems.map((item) => ({
      ...item,
      category: exampleItems.get(item.id)?.category
        ?? (item.category === '학용품' ? '기타' : item.category),
      storageLocation: '학생부실',
    }))
      window.localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(normalizedItems))
      return normalizedItems
  } catch (error) {
    console.error('저장된 분실물 데이터를 불러오지 못했습니다.', error)
    return lostItems
  }
}

export default function App() {
  const [screen, setScreen] = useState('home')
  const [selectedCategory, setSelectedCategory] = useState('텀블러')
  const [selectedItem, setSelectedItem] = useState(null)
  const [items, setItems] = useState(loadItems)
  const [largeText, setLargeText] = useState(() => readPreference(LARGE_TEXT_STORAGE_KEY))
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  function togglePreference(setter, key) {
    setter((current) => {
      const next = !current
      try {
        window.localStorage.setItem(key, String(next))
      } catch (error) {
        console.error('화면 설정을 저장하지 못했습니다.', error)
      }
      return next
    })
  }

  function saveItems(nextItems) {
    try {
      window.localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(nextItems))
      setItems(nextItems)
      return true
    } catch (error) {
      console.error('분실물 정보를 저장하지 못했습니다.', error)
      window.alert('저장 공간이 부족하거나 브라우저 저장 기능을 사용할 수 없습니다. 사진 크기를 줄여 다시 시도해 주세요.')
      return false
    }
  }

  function showCategory(category) {
    setSelectedCategory(category)
    setScreen('list')
  }

  function showItem(item) {
    setSelectedItem(item)
    setScreen('detail')
  }

  function returnToList() {
    setScreen('list')
  }

  function openAdmin(password) {
    if (password !== '0417') {
      setPasswordError('비밀번호가 올바르지 않습니다.')
      return
    }
    setPasswordError('')
    setPasswordOpen(false)
    setScreen('admin')
  }

  function addItem(item) {
    return saveItems([item, ...items])
  }

  function updateItem(updatedItem) {
    return saveItems(items.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
  }

  function deleteItem(itemId) {
    return saveItems(items.filter((item) => item.id !== itemId))
  }

  return (
    <div className={`app-shell${largeText ? ' app-shell--large-text' : ''}`}>
      {screen === 'home' && (
        <HomePage
          onSelectCategory={showCategory}
          largeText={largeText}
          onToggleLargeText={() => togglePreference(setLargeText, LARGE_TEXT_STORAGE_KEY)}
          onOpenAdmin={() => {
            setPasswordError('')
            setPasswordOpen(true)
          }}
        />
      )}
      {screen === 'list' && (
        <ItemListPage
          category={selectedCategory}
          items={items}
          onHome={() => setScreen('home')}
          onSelectItem={showItem}
        />
      )}
      {screen === 'detail' && selectedItem && (
        <ItemDetailPage
          item={selectedItem}
          onHome={() => setScreen('home')}
          onBack={returnToList}
        />
      )}
      {screen === 'admin' && (
        <AdminPage
          items={items}
          onHome={() => setScreen('home')}
          onAddItem={addItem}
          onUpdateItem={updateItem}
          onDeleteItem={deleteItem}
        />
      )}
      {passwordOpen && (
        <div className="dialog-backdrop">
          <form
            className="password-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-title"
            onSubmit={(event) => {
              event.preventDefault()
              openAdmin(new FormData(event.currentTarget).get('password'))
            }}
          >
            <h2 id="password-title">관리자 비밀번호</h2>
            <p>관리자 화면에 들어가려면 비밀번호를 입력해 주세요.</p>
            <label htmlFor="admin-password">비밀번호</label>
            <input
              autoFocus
              id="admin-password"
              name="password"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              aria-describedby={passwordError ? 'password-error' : undefined}
              required
            />
            {passwordError && (
              <p className="form-error" id="password-error" role="alert">
                {passwordError}
              </p>
            )}
            <div className="dialog-actions">
              <button
                className="button button--muted"
                onClick={() => setPasswordOpen(false)}
                type="button"
              >
                취소
              </button>
              <button className="button button--primary" type="submit">
                확인
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
