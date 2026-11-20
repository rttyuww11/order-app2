import { useCallback, useEffect, useState } from 'react'
import AdminPage from './pages/AdminPage.jsx'
import HomePage from './pages/HomePage.jsx'
import ItemDetailPage from './pages/ItemDetailPage.jsx'
import ItemListPage from './pages/ItemListPage.jsx'
import { apiRequest } from './api.js'

const ITEMS_STORAGE_KEY = 'school-lost-and-found-items'
const LARGE_TEXT_STORAGE_KEY = 'school-lost-and-found-large-text'

function readPreference(key) {
  try {
    return window.localStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

export default function App() {
  const [screen, setScreen] = useState('home')
  const [selectedCategory, setSelectedCategory] = useState('텀블러')
  const [selectedItem, setSelectedItem] = useState(null)
  const [items, setItems] = useState([])
  const [itemsLoading, setItemsLoading] = useState(true)
  const [itemsError, setItemsError] = useState('')
  const [largeText, setLargeText] = useState(() => readPreference(LARGE_TEXT_STORAGE_KEY))
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  const loadItems = useCallback(async () => {
    setItemsLoading(true)
    setItemsError('')
    try {
      const result = await apiRequest('/api/items')
      if (!Array.isArray(result.items)) {
        throw new Error('분실물 데이터 형식이 올바르지 않습니다.')
      }
      setItems(result.items)
    } catch (error) {
      console.error('분실물 데이터를 불러오지 못했습니다.', error)
      setItemsError(error.message || '분실물 데이터를 불러오지 못했습니다.')
    } finally {
      setItemsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

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

  async function openAdmin(password) {
    setPasswordError('')
    try {
      await apiRequest('/api/admin/login', {
        method: 'POST',
        body: { password },
      })
      setAdminPassword(password)
    } catch (error) {
      setPasswordError(
        error.status === 401
          ? '비밀번호가 올바르지 않습니다.'
          : error.message || '관리자 인증에 실패했습니다.',
      )
      return
    }

    try {
      const savedItems = window.localStorage.getItem(ITEMS_STORAGE_KEY)
      if (savedItems) {
        const legacyItems = JSON.parse(savedItems)
        if (!Array.isArray(legacyItems)) {
          throw new Error('기존 브라우저 분실물 데이터 형식이 올바르지 않습니다.')
        }
        const result = await apiRequest('/api/items/import-local', {
          method: 'POST',
          body: legacyItems,
          adminPassword: password,
        })
        setItems(result.items)
        window.localStorage.removeItem(ITEMS_STORAGE_KEY)
      }
    } catch (error) {
      console.error('기존 브라우저 데이터를 서버로 옮기지 못했습니다.', error)
      window.alert(`기존 브라우저 데이터를 서버로 옮기지 못했습니다. ${error.message}`)
    }

    setPasswordOpen(false)
    setScreen('admin')
  }

  async function addItem(item) {
    await apiRequest('/api/items', { method: 'POST', body: item, adminPassword })
    setItems((currentItems) => [item, ...currentItems])
    return true
  }

  async function updateItem(updatedItem) {
    await apiRequest(`/api/items/${encodeURIComponent(updatedItem.id)}`, {
      method: 'PUT',
      body: updatedItem,
      adminPassword,
    })
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    )
    return true
  }

  async function deleteItem(itemId) {
    await apiRequest(`/api/items/${encodeURIComponent(itemId)}`, {
      method: 'DELETE',
      adminPassword,
    })
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId))
  }

  if (itemsLoading) {
    return (
      <div className="app-shell">
        <main className="content-page">분실물 정보를 불러오는 중입니다.</main>
      </div>
    )
  }

  if (itemsError) {
    return (
      <div className="app-shell">
        <main className="content-page">
          <p className="form-error" role="alert">{itemsError}</p>
          <button className="button button--primary" onClick={loadItems} type="button">
            다시 시도
          </button>
        </main>
      </div>
    )
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
          onHome={() => {
            setAdminPassword('')
            setScreen('home')
          }}
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
