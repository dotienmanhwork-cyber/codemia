// src/features/admin/pages/__tests__/AdminUserDetail.test.jsx
//
// Chạy: vitest --environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdminUserDetail from '../AdminUserDetail'
import * as api from '../../api/admin.api'

// ── Mock toàn bộ API ────────────────────────────────────
vi.mock('../../api/admin.api')

vi.mock('../../../../shared/components/dashboard-ui/PageHeader',
  () => ({ default: ({ title }) => <div data-testid="page-header">{title}</div> }))

vi.mock('../../../../shared/components/dashboard-ui/StatusBadge',
  () => ({ default: ({ label }) => <span data-testid="status-badge">{label}</span> }))

vi.mock('../../../../shared/components/dashboard-ui/ConfirmModal',
  () => ({
    default: ({ open, onConfirm, onClose, title, loading }) =>
      open ? (
        <div data-testid="confirm-modal">
          <span>{title}</span>
          <button onClick={onConfirm} disabled={loading}>Confirm</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      ) : null,
  }))

vi.mock('../../components/AdminAvatarSm',
  () => ({ default: ({ name }) => <div>{name}</div> }))

// ── Helpers ──────────────────────────────────────────────
const renderWithRouter = (userId = '42') =>
  render(
    <MemoryRouter initialEntries={[`/admin/users/${userId}`]}>
      <Routes>
        <Route path="/admin/users/:id" element={<AdminUserDetail />} />
      </Routes>
    </MemoryRouter>,
  )

const makeUser = (role = 'TEACHER', status = 'ACTIVE') => ({
  id: 42,
  fullName: 'Nguyen Van A',
  email: 'a@example.com',
  role,
  status,
  avatarUrl: null,
  createdAt: '2024-01-01T00:00:00Z',
})

const makeImpact = (overrides = {}) => ({
  courseCount: 2,
  activeEnrollments: 50,
  pendingWithdrawals: 1,
  pendingBalance: 500000,
  ...overrides,
})

// ── Wait helpers ─────────────────────────────────────────
// asStudent: đợi radio Student được checked (component set checked dựa vào user.role)
// asTeacher: component KHÔNG set checked=true trên Teacher radio nên không thể
//   dùng radio.checked. Thay vào đó đợi Save Changes button xuất hiện (disabled)
//   — đó là tín hiệu data đã load xong.
const waitForLoaded = {
  asStudent: () => waitFor(() => {
    const radio = screen.getByLabelText(/student/i)
    if (!radio.checked) throw new Error('Student radio not checked yet')
  }),
  asTeacher: () => waitFor(() => {
    screen.getByLabelText(/teacher/i)
    screen.getByRole('button', { name: /save changes/i })
  }),
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ════════════════════════════════════════════════════════
describe('AdminUserDetail — Upgrade flow (STUDENT → TEACHER)', () => {
  beforeEach(() => {
    api.getUserDetail.mockResolvedValue({
      result: { user: makeUser('STUDENT'), roleLogs: [] },
    })
  })

  it('nút Save Changes disabled khi chưa đổi role', async () => {
    renderWithRouter()
    await waitForLoaded.asStudent()

    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled()
  })

  it('chọn Teacher → nút Save Changes enabled', async () => {
    renderWithRouter()
    await waitForLoaded.asStudent()

    fireEvent.click(screen.getByLabelText(/teacher/i))
    expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled()
  })

  it('upgrade mở ConfirmModal thông thường (không fetch impact)', async () => {
    renderWithRouter()
    await waitForLoaded.asStudent()

    fireEvent.click(screen.getByLabelText(/teacher/i))
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument()
    expect(api.getDowngradeImpact).not.toHaveBeenCalled()
  })

  it('confirm upgrade → gọi updateUserRole, không gọi downgradeUserRole', async () => {
    api.updateUserRole.mockResolvedValue({ result: {} })
    api.getUserDetail.mockResolvedValue({
      result: { user: makeUser('TEACHER'), roleLogs: [] },
    })

    renderWithRouter()
    await waitForLoaded.asStudent()

    fireEvent.click(screen.getByLabelText(/teacher/i))
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    fireEvent.click(within(screen.getByTestId('confirm-modal')).getByText('Confirm'))

    await waitFor(() => {
      expect(api.updateUserRole).toHaveBeenCalledWith('42', 'TEACHER')
      expect(api.downgradeUserRole).not.toHaveBeenCalled()
    })
  })
})

// ════════════════════════════════════════════════════════
describe('AdminUserDetail — Downgrade flow (TEACHER → STUDENT)', () => {
  // FIX (Failure 2): Component dùng "Save Changes" làm trigger chung cho cả
  // upgrade lẫn downgrade. Khi TEACHER chọn Student radio, Save Changes được
  // enable. Click Save Changes → gọi getDowngradeImpact (async) → render inline
  // downgrade form (impact details + textarea + "Xác nhận hạ role" button).
  // KHÔNG có nút "Hạ role" riêng biệt và không có bước radio-click nào trigger
  // form trực tiếp — phải đi qua Save Changes.

  beforeEach(() => {
    api.getUserDetail.mockResolvedValue({
      result: { user: makeUser('TEACHER'), roleLogs: [] },
    })
    api.getDowngradeImpact.mockResolvedValue({ result: makeImpact() })
  })

  it('chọn Student → nút Save Changes enabled', async () => {
    renderWithRouter()
    await waitForLoaded.asTeacher()

    fireEvent.click(screen.getByLabelText(/student/i))
    expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled()
  })

  it('click Save Changes khi chọn Student → gọi getDowngradeImpact', async () => {
    renderWithRouter()
    await waitForLoaded.asTeacher()

    fireEvent.click(screen.getByLabelText(/student/i))
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    expect(api.getDowngradeImpact).toHaveBeenCalledWith('42')
  })

  it('modal hiển thị impact: courseCount, activeEnrollments, pendingWithdrawals', async () => {
    renderWithRouter()
    await waitForLoaded.asTeacher()

    fireEvent.click(screen.getByLabelText(/student/i))
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText(/2 khoá/i)).toBeInTheDocument()
      expect(screen.getByText(/50 người/i)).toBeInTheDocument()
      expect(screen.getByText(/1 request/i)).toBeInTheDocument()
    })
  })

  it('modal hiển thị cảnh báo HOLD khi có pendingWithdrawals', async () => {
    renderWithRouter()
    await waitForLoaded.asTeacher()

    fireEvent.click(screen.getByLabelText(/student/i))
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText(/HOLD/)).toBeInTheDocument()
      expect(screen.getByText(/xử lý thủ công/i)).toBeInTheDocument()
    })
  })

  it('impact = 0 → hiển thị banner xanh "không có tác động"', async () => {
    api.getDowngradeImpact.mockResolvedValue({
      result: makeImpact({ courseCount: 0, activeEnrollments: 0, pendingWithdrawals: 0 }),
    })

    renderWithRouter()
    await waitForLoaded.asTeacher()

    fireEvent.click(screen.getByLabelText(/student/i))
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText(/không có tác động/i)).toBeInTheDocument()
    })
  })

  it('nút "Xác nhận hạ role" disabled khi chưa nhập lý do', async () => {
    renderWithRouter()
    await waitForLoaded.asTeacher()

    fireEvent.click(screen.getByLabelText(/student/i))
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    // Đợi impact data render xong trước khi assert button state
    await waitFor(() => screen.getByText(/2 khoá/i))

    expect(screen.getByRole('button', { name: /xác nhận hạ role/i })).toBeDisabled()
  })

  it('nhập lý do → nút "Xác nhận hạ role" enabled', async () => {
    renderWithRouter()
    await waitForLoaded.asTeacher()

    fireEvent.click(screen.getByLabelText(/student/i))
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => screen.getByText(/2 khoá/i))

    await userEvent.type(screen.getByPlaceholderText(/nhập lý do/i), 'Vi phạm điều khoản sử dụng')
    expect(screen.getByRole('button', { name: /xác nhận hạ role/i })).not.toBeDisabled()
  })

  it('confirm → gọi downgradeUserRole với đúng note, KHÔNG gọi updateUserRole', async () => {
    api.downgradeUserRole.mockResolvedValue({ result: { user: makeUser('STUDENT') } })
    api.getUserDetail.mockResolvedValue({
      result: { user: makeUser('STUDENT'), roleLogs: [] },
    })

    renderWithRouter()
    await waitForLoaded.asTeacher()

    fireEvent.click(screen.getByLabelText(/student/i))
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => screen.getByText(/2 khoá/i))

    await userEvent.type(screen.getByPlaceholderText(/nhập lý do/i), 'Vi phạm điều khoản')
    fireEvent.click(screen.getByRole('button', { name: /xác nhận hạ role/i }))

    await waitFor(() => {
      expect(api.downgradeUserRole).toHaveBeenCalledWith('42', 'Vi phạm điều khoản')
      expect(api.updateUserRole).not.toHaveBeenCalled()
    })
  })

  it('sau khi downgrade thành công → form đóng (nút "Xác nhận hạ role" biến mất)', async () => {
    api.downgradeUserRole.mockResolvedValue({ result: { user: makeUser('STUDENT') } })
    api.getUserDetail
      .mockResolvedValueOnce({ result: { user: makeUser('TEACHER'), roleLogs: [] } })
      .mockResolvedValueOnce({ result: { user: makeUser('STUDENT'), roleLogs: [] } })

    renderWithRouter()
    await waitForLoaded.asTeacher()

    fireEvent.click(screen.getByLabelText(/student/i))
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => screen.getByText(/2 khoá/i))

    await userEvent.type(screen.getByPlaceholderText(/nhập lý do/i), 'Vi phạm')
    fireEvent.click(screen.getByRole('button', { name: /xác nhận hạ role/i }))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /xác nhận hạ role/i })).not.toBeInTheDocument()
    })
  })

  it('getDowngradeImpact lỗi → form vẫn mở, nút confirm disabled (impact null)', async () => {
    api.getDowngradeImpact.mockRejectedValue(new Error('Network error'))

    renderWithRouter()
    await waitForLoaded.asTeacher()

    fireEvent.click(screen.getByLabelText(/student/i))
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    // Form mở ngay, impact null → confirm phải disabled
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /xác nhận hạ role/i })).toBeDisabled()
    })
  })
})

// ════════════════════════════════════════════════════════
describe('AdminUserDetail — Admin role read-only', () => {
  it('ADMIN: không hiển thị radio buttons, hiện thông báo read-only', async () => {
    api.getUserDetail.mockResolvedValue({
      result: { user: makeUser('ADMIN'), roleLogs: [] },
    })

    renderWithRouter()

    await waitFor(() => screen.getByText(/admin role cannot be changed/i))

    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    expect(screen.getByText(/admin role cannot be changed/i)).toBeInTheDocument()
  })
})