// src/features/admin/pages/AdminCategories.jsx
import { useEffect, useMemo, useState, useContext } from 'react'
import { DashboardSearchContext } from '@/layouts/DashboardLayout'
import { FolderOpen, Folder, ChevronRight, Plus } from 'lucide-react'
import PageHeader   from '../../../shared/components/dashboard-ui/PageHeader'
import SearchBar    from '../../../shared/components/dashboard-ui/SearchBar'
import ConfirmModal from '../../../shared/components/dashboard-ui/ConfirmModal'
import FormModal    from '../../../shared/components/dashboard-ui/FormModal'
import {
  getAdminCategories,
  getCategoryUsage,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../api/admin.api'

/* ── Helpers ── */

/** Flatten tree → [{...cat, depth}] để render table */
function flattenTree(nodes, depth = 0) {
  const rows = []
  for (const node of nodes) {
    rows.push({ ...node, depth })
    if (node.children?.length) {
      rows.push(...flattenTree(node.children, depth + 1))
    }
  }
  return rows
}

/* ══════════════════════════════════════════════
   AdminCategories
══════════════════════════════════════════════ */
export default function AdminCategories() {
  /* ── Data state ── */
  const [tree,    setTree]    = useState([])
  const [loading, setLoading] = useState(true)

  /* ── Search ── */
  const { keyword: search, setKeyword: setSearch } = useContext(DashboardSearchContext)
  const [keyword, setKeyword] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setKeyword(search.trim().toLowerCase()), 300)
    return () => clearTimeout(t)
  }, [search])

  /* ── Modal: Create / Edit ── */
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editing,      setEditing]      = useState(null)   // null = create
  const [catName,      setCatName]      = useState('')
  const [parentId,     setParentId]     = useState('')
  const [formError,    setFormError]    = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  /* ── Modal: Delete ── */
  const [deleteTarget, setDeleteTarget] = useState(null)  // { id, name, hasChildren }

  /* ── Modal: Reassign (khi category có courses) ── */
  const [reassignTarget,    setReassignTarget]    = useState(null)  // { id, name, courseCount }
  const [targetCategoryId,  setTargetCategoryId]  = useState('')
  const [reassignError,     setReassignError]      = useState('')

  /* ── Toast ── */
  const [toast, setToast] = useState('')

  /* ── Fetch ── */
  async function load() {
    setLoading(true)
    try {
      const res = await getAdminCategories()
      setTree(res.result || [])
    } catch (err) {
      console.error('Failed to fetch categories', err)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  /* ── Derived: filtered rows ── */
  const allRows = useMemo(() => flattenTree(tree), [tree])
  const roots   = tree  // API trả về root-level

  const rows = useMemo(() => {
    if (!keyword) return allRows
    return allRows.filter((r) =>
      r.name.toLowerCase().includes(keyword) ||
      r.slug?.toLowerCase().includes(keyword)
    )
  }, [allRows, keyword])

  /* ── Open modals ── */
  function openCreate() {
    setEditing(null)
    setCatName('')
    setParentId('')
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(row) {
    // Tìm parentId: nếu là child thì tìm root chứa nó
    const parent = roots.find((r) => r.children?.some((c) => c.id === row.id))
    setEditing({ id: row.id })
    setCatName(row.name)
    setParentId(parent ? String(parent.id) : '')
    setFormError('')
    setModalOpen(true)
  }

  async function openDelete(row) {
    // Fetch usage trước → quyết định hiện modal nào
    try {
      const res = await getCategoryUsage(row.id)
      const { courseCount, hasChildren } = res.result ?? {}

      if (courseCount > 0) {
        // Có courses → cần reassign trước khi xóa
        setTargetCategoryId('')
        setReassignError('')
        setReassignTarget({
          id:          row.id,
          name:        row.name,
          courseCount,
          hasChildren: hasChildren ?? (row.children?.length ?? 0) > 0,
        })
      } else {
        // Không có course → confirm đơn giản
        setDeleteTarget({
          id:          row.id,
          name:        row.name,
          hasChildren: hasChildren ?? (row.children?.length ?? 0) > 0,
        })
      }
    } catch (err) {
      console.error('Failed to fetch category usage', err)
      // Fallback: mở confirm modal bình thường nếu không fetch được
      setDeleteTarget({
        id:          row.id,
        name:        row.name,
        hasChildren: (row.children?.length ?? 0) > 0,
      })
    }
  }

  /* ── Save (create / edit) ── */
  async function handleSaveConfirm() {
    if (!catName.trim()) { setFormError('Tên danh mục không được để trống.'); return }
    setActionLoading(true)
    const body = {
      name:     catName.trim(),
      parentId: parentId !== '' ? Number(parentId) : null,
    }
    try {
      if (editing) {
        await updateCategory(editing.id, body)
        showToast('✅ Đã cập nhật danh mục.')
      } else {
        await createCategory(body)
        showToast('✅ Đã thêm danh mục mới.')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setFormError('Có lỗi xảy ra, vui lòng thử lại.')
      console.error('Save category failed', err)
    } finally {
      setActionLoading(false)
    }
  }

  /* ── Delete ── */
  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setActionLoading(true)
    try {
      await deleteCategory(deleteTarget.id)
      setDeleteTarget(null)
      showToast('🗑️ Đã xoá danh mục.')
      load()
    } catch (err) {
      console.error('Delete category failed', err)
    } finally {
      setActionLoading(false)
    }
  }

  /* ── Reassign + Delete ── */
  async function handleReassignConfirm() {
    if (!reassignTarget) return
    if (!targetCategoryId) {
      setReassignError('Vui lòng chọn danh mục đích.')
      return
    }
    setActionLoading(true)
    try {
      await deleteCategory(reassignTarget.id, {
        targetCategoryId: Number(targetCategoryId),
      })
      setReassignTarget(null)
      showToast('🗑️ Đã xoá danh mục và chuyển courses thành công.')
      load()
    } catch (err) {
      setReassignError('Có lỗi xảy ra, vui lòng thử lại.')
      console.error('Reassign + delete category failed', err)
    } finally {
      setActionLoading(false)
    }
  }

  /* ── Render ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 100,
          background: 'var(--ink)', color: '#fff',
          padding: '10px 18px', borderRadius: 'var(--radius-sm)',
          fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
        }}>
          {toast}
        </div>
      )}

      <PageHeader
        title="Danh mục"
        subtitle="Quản lý cây danh mục khóa học được sử dụng để phân loại các khóa học."
      />

      {/* Table card */}
      <div style={{
        background:    'var(--surface)',
        border:        '0.5px solid var(--border)',
        borderRadius:  'var(--radius)',
        overflow:      'hidden',
      }}>

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', gap: 12,
          borderBottom: '0.5px solid var(--border)',
          flexWrap: 'wrap',
        }}>
          {/* Count */}
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)' }}>
            {loading ? '…' : `${allRows.length} danh mục`}
          </span>

          {/* Right side: search + add */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SearchBar
              value={search}
              onChange={(v) => setSearch(v)}
              placeholder="Tìm tên, slug…"
              width={220}
            />
            <button
              onClick={openCreate}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 12px',
                background: 'var(--ink)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-sm)',
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              <Plus size={13} />
              Thêm danh mục
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            Đang tải…
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            {keyword ? 'Không tìm thấy danh mục nào phù hợp.' : 'Chưa có danh mục nào.'}
          </div>
        ) : (
          <table className="dt">
            <thead>
              <tr>
                <th>Tên danh mục</th>
                <th>Slug</th>
                <th>Loại</th>
                <th>Danh mục con</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {/* Name — indent by depth */}
                  <td>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      paddingLeft: row.depth * 20,
                    }}>
                      {row.depth === 0
                        ? <FolderOpen size={15} color="var(--purple)" />
                        : (
                          <>
                            <ChevronRight size={12} color="var(--ink-3)" />
                            <Folder size={14} color="var(--ink-3)" />
                          </>
                        )
                      }
                      <span style={{ fontWeight: row.depth === 0 ? 600 : 400 }}>
                        {row.name}
                      </span>
                    </div>
                  </td>

                  {/* Slug */}
                  <td>
                    <code style={{
                      fontSize: 11, background: 'var(--border-faint)',
                      padding: '2px 6px', borderRadius: 4, color: 'var(--ink-2)',
                    }}>
                      {row.slug}
                    </code>
                  </td>

                  {/* Type badge */}
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px',
                      borderRadius: 99,
                      background: row.depth === 0 ? 'var(--purple-light)' : 'var(--border-faint)',
                      color:      row.depth === 0 ? 'var(--purple-dim)'   : 'var(--ink-3)',
                    }}>
                      {row.depth === 0 ? 'Gốc' : 'Con'}
                    </span>
                  </td>

                  {/* Children count */}
                  <td style={{ color: 'var(--ink-3)', fontSize: 13 }}>
                    {row.depth === 0
                      ? `${row.children?.length ?? 0} danh mục`
                      : '—'
                    }
                  </td>

                  {/* Actions — text buttons matching CourseTable style */}
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openEdit(row)}
                        style={{
                          padding: '4px 10px',
                          border: '0.5px solid var(--border)',
                          borderRadius: 'var(--radius-xs)',
                          background: 'transparent', color: 'var(--ink-2)',
                          fontSize: 12, fontWeight: 500,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => openDelete(row)}
                        style={{
                          padding: '4px 10px',
                          border: '0.5px solid var(--red-bg)',
                          borderRadius: 'var(--radius-xs)',
                          background: 'transparent', color: 'var(--red)',
                          fontSize: 12, fontWeight: 500,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal: Create / Edit ── */}
      {modalOpen && (
        <FormModal
          open
          onClose={() => setModalOpen(false)}
          onSubmit={handleSaveConfirm}
          title={editing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}
          submitLabel={editing ? 'Lưu thay đổi' : 'Tạo danh mục'}
          cancelLabel="Hủy"
          loading={actionLoading}
          width={420}
        >
          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
              Tên danh mục <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <input
              value={catName}
              onChange={(e) => { setCatName(e.target.value); setFormError('') }}
              placeholder="Ví dụ: Phát triển Web"
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '8px 10px',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13, color: 'var(--ink)',
                background: 'var(--bg)',
                fontFamily: 'inherit', outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--ink-3)'}
              onBlur={(e)  => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Parent */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
              Danh mục cha{' '}
              <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(tùy chọn)</span>
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '8px 10px',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13, color: 'var(--ink)',
                background: 'var(--bg)',
                fontFamily: 'inherit', outline: 'none',
              }}
            >
              <option value="">— Không có (danh mục gốc) —</option>
              {roots
                .filter((r) => r.id !== editing?.id)
                .map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
            </select>
          </div>

          {formError && (
            <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{formError}</p>
          )}
        </FormModal>
      )}

      {/* ── Modal: Delete ── */}
      {deleteTarget && (
        <ConfirmModal
          open
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          title={`Xóa "${deleteTarget.name}"?`}
          description={
            deleteTarget.hasChildren
              ? 'Danh mục này có danh mục con. Xóa danh mục này sẽ xóa liên kết danh mục cha của tất cả danh mục con.'
              : 'Danh mục này sẽ bị xóa vĩnh viễn khỏi nền tảng.'
          }
          confirmLabel="Xóa danh mục"
          danger
          loading={actionLoading}
        />
      )}

      {/* ── Modal: Reassign courses before delete ── */}
      {reassignTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '24px 28px',
            width: 440, maxWidth: '90vw',
            display: 'flex', flexDirection: 'column', gap: 18,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                Xóa "{reassignTarget.name}"
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                Danh mục này hiện đang được liên kết với{' '}
                <strong style={{ color: 'var(--ink-2)' }}>
                  {reassignTarget.courseCount} khóa học
                </strong>
                . Vui lòng chọn danh mục mới để chuyển các khóa học này sang trước khi xóa.
              </p>
            </div>

            {/* Divider */}
            <div style={{ height: '0.5px', background: 'var(--border)', margin: '0 -28px' }} />

            {/* Target category select */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
                Chuyển toàn bộ khóa học sang <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <select
                value={targetCategoryId}
                onChange={(e) => { setTargetCategoryId(e.target.value); setReassignError('') }}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '8px 10px',
                  border: `0.5px solid ${reassignError ? 'var(--red)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13, color: 'var(--ink)',
                  background: 'var(--bg)',
                  fontFamily: 'inherit', outline: 'none',
                }}
              >
                <option value="">— Chọn danh mục đích —</option>
                {allRows
                  // loại category đang xóa + toàn bộ children của nó
                  .filter((r) => {
                    if (r.id === reassignTarget.id) return false
                    // loại children trực tiếp (depth > 0 và parent là reassignTarget)
                    const parentOfRow = roots.find((root) =>
                      root.children?.some((c) => c.id === r.id)
                    )
                    return parentOfRow?.id !== reassignTarget.id
                  })
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.depth > 0 ? `  ↳ ${r.name}` : r.name}
                    </option>
                  ))}
              </select>
              {reassignError && (
                <p style={{ margin: 0, fontSize: 12, color: 'var(--red)' }}>
                  {reassignError}
                </p>
              )}
            </div>

            {/* Warning nếu có children */}
            {reassignTarget.hasChildren && (
              <div style={{
                padding: '10px 12px',
                background: 'var(--yellow-bg, #fffbeb)',
                border: '0.5px solid var(--yellow-border, #fde68a)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12, color: 'var(--yellow-text, #92400e)',
                lineHeight: 1.5,
              }}>
                ⚠️ Danh mục này cũng có các danh mục con. Chúng sẽ trở thành danh mục gốc sau khi xóa.
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button
                onClick={() => setReassignTarget(null)}
                disabled={actionLoading}
                style={{
                  padding: '7px 14px',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent', color: 'var(--ink-2)',
                  fontSize: 13, fontWeight: 500,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleReassignConfirm}
                disabled={actionLoading}
                style={{
                  padding: '7px 14px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--red)',
                  color: '#fff',
                  fontSize: 13, fontWeight: 600,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                {actionLoading ? 'Đang chuyển...' : 'Chuyển & xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}