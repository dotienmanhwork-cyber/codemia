// src/features/admin/components/__tests__/AdminWithdrawalTable.test.jsx
//
// Chạy: vitest --environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import AdminWithdrawalTable from '../AdminWithdrawalTable'

// ── Mock shared UI ────────────────────────────────────────
vi.mock('../../../../shared/components/dashboard-ui/StatusBadge',
  () => ({ default: ({ label }) => <span data-testid="badge">{label}</span> }))

vi.mock('../../../../shared/components/dashboard-ui/ConfirmModal',
  () => ({
    default: ({ open, onConfirm, onClose, title }) =>
      open ? (
        <div data-testid="confirm-modal">
          <span>{title}</span>
          <button onClick={onConfirm}>Confirm</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      ) : null,
  }))

vi.mock('../../../../shared/components/dashboard-ui/FormModal',
  () => ({
    default: ({ open, onSubmit, onClose, children }) =>
      open ? (
        <div data-testid="reject-modal">
          {children}
          <button onClick={onSubmit}>Submit</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      ) : null,
  }))

// ── Fixtures ──────────────────────────────────────────────
const makeWithdrawal = (overrides = {}) => ({
  id: 1,
  teacherName: 'Teacher A',
  teacherEmail: 'a@example.com',
  amount: 1000000,
  status: 'PENDING',
  bankAccountInfo: 'Vietcombank - 1234567890',
  bankSnapshot: null,
  createdAt: '2024-06-01T00:00:00Z',
  processedBy: null,
  ...overrides,
})

const defaultProps = (overrides = {}) => {
  const data = overrides.data ?? []
  const statusCounts = {
    ALL: data.length,
    HOLD: data.filter((r) => r.status === 'HOLD').length,
    PENDING: data.filter((r) => r.status === 'PENDING').length,
    APPROVED: data.filter((r) => r.status === 'APPROVED').length,
    REJECTED: data.filter((r) => r.status === 'REJECTED').length,
  }
  return {
    data: [],
    statusCounts,
    loading: false,
    activeStatus: 'ALL',
    onStatusChange: vi.fn(),
    onApprove: vi.fn(),
    onReject: vi.fn(),
    approving: false,
    rejecting: false,
    ...overrides,
  }
}

// ── Helper: tìm row chứa một text cụ thể ─────────────────
// Dùng để scope button queries — tránh fail khi component
// render batch-approve hoặc nhiều Approve buttons cùng lúc.
const getRowContaining = (text) => {
  const cell = screen.getByText(text)
  // Đi ngược DOM đến <tr> hoặc element có role="row"
  return cell.closest('tr') ?? cell.closest('[role="row"]')
}

// ════════════════════════════════════════════════════════
describe('AdminWithdrawalTable — Tab HOLD', () => {
  it('tab HOLD xuất hiện trong danh sách tabs', () => {
    render(<AdminWithdrawalTable {...defaultProps()} />)
    expect(screen.getByRole('button', { name: /xử/i })).toBeInTheDocument()
  })

  it('tab HOLD đứng trước PENDING', () => {
    render(<AdminWithdrawalTable {...defaultProps()} />)
    const buttons = screen.getAllByRole('button')
    const tabLabels = buttons.map((b) => b.textContent?.trim()).filter(Boolean)
    const holdIdx    = tabLabels.findIndex((t) => /xử/i.test(t))
    const pendingIdx = tabLabels.findIndex((t) => /chờ/i.test(t))
    expect(holdIdx).toBeLessThan(pendingIdx)
  })

  it('click tab HOLD → gọi onStatusChange("HOLD")', () => {
    const onStatusChange = vi.fn()
    render(<AdminWithdrawalTable {...defaultProps({ onStatusChange })} />)
    fireEvent.click(screen.getByRole('button', { name: /xử/i }))
    expect(onStatusChange).toHaveBeenCalledWith('HOLD')
  })

  it('tab HOLD hiển thị đúng số lượng HOLD rows', () => {
    const data = [
      makeWithdrawal({ id: 1, status: 'HOLD' }),
      makeWithdrawal({ id: 2, status: 'HOLD' }),
      makeWithdrawal({ id: 3, status: 'PENDING' }),
    ]
    render(<AdminWithdrawalTable {...defaultProps({ data })} />)
    // Tab HOLD phải hiện badge "2"
    const holdTab = screen.getByRole('button', { name: /xử/i })
    expect(holdTab.textContent).toMatch('2')
  })

  it('filter tab HOLD → chỉ hiển thị HOLD rows', () => {
    const data = [
      makeWithdrawal({ id: 1, status: 'HOLD',   teacherName: 'Hold Teacher' }),
      makeWithdrawal({ id: 2, status: 'PENDING', teacherName: 'Pending Teacher' }),
    ]
    const filteredData = data.filter((r) => r.status === 'HOLD')
    render(<AdminWithdrawalTable {...defaultProps({ data: filteredData, activeStatus: 'HOLD' })} />)
    expect(screen.getByText('Hold Teacher')).toBeInTheDocument()
    expect(screen.queryByText('Pending Teacher')).not.toBeInTheDocument()
  })
})

// ════════════════════════════════════════════════════════
describe('AdminWithdrawalTable — Banner cảnh báo HOLD', () => {
  const dataWithHold = [
    makeWithdrawal({ id: 1, status: 'HOLD' }),
    makeWithdrawal({ id: 2, status: 'PENDING' }),
  ]

  it('hiện banner khi đang ở tab ALL và có HOLD rows', () => {
    render(<AdminWithdrawalTable {...defaultProps({ data: dataWithHold, activeStatus: 'ALL' })} />)
    // Banner thực tế hiển thị "Có X yêu cầu trạng thái HOLD"
    expect(screen.getByText(/cần xem/i)).toBeInTheDocument()
  })

  it('banner có nút "Xem ngay" gọi onStatusChange("HOLD")', () => {
    const onStatusChange = vi.fn()
    render(<AdminWithdrawalTable {...defaultProps({ data: dataWithHold, activeStatus: 'ALL', onStatusChange })} />)
    fireEvent.click(screen.getByText('Xem ngay'))
    expect(onStatusChange).toHaveBeenCalledWith('HOLD')
  })

  it('KHÔNG hiện banner khi đang ở tab HOLD', () => {
    render(<AdminWithdrawalTable {...defaultProps({ data: dataWithHold, activeStatus: 'HOLD' })} />)
    expect(screen.queryByText('Xem ngay')).not.toBeInTheDocument()
  })

  it('KHÔNG hiện banner khi không có HOLD rows', () => {
    const data = [makeWithdrawal({ id: 1, status: 'PENDING' })]
    render(<AdminWithdrawalTable {...defaultProps({ data, activeStatus: 'ALL' })} />)
    expect(screen.queryByText('Xem ngay')).not.toBeInTheDocument()
  })
})

// ════════════════════════════════════════════════════════
describe('AdminWithdrawalTable — HOLD row: action column', () => {
  it('HOLD row không có nút Approve/Reject', () => {
    const data = [makeWithdrawal({ id: 1, status: 'HOLD' })]
    render(<AdminWithdrawalTable {...defaultProps({ data, activeStatus: 'HOLD' })} />)
    const row = getRowContaining('Teacher A')
    expect(within(row).queryByRole('button', { name: /phê/i })).not.toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: /chối/i })).not.toBeInTheDocument()
  })

  it('HOLD row hiển thị text "Xử lý thủ công"', () => {
    const data = [makeWithdrawal({ id: 1, status: 'HOLD' })]
    render(<AdminWithdrawalTable {...defaultProps({ data, activeStatus: 'HOLD' })} />)
    // getAllByText: "Xử lý thủ công" có thể xuất hiện cả ở badge lẫn action cell
    expect(screen.getAllByText(/xử lý thủ công/i).length).toBeGreaterThan(0)
  })

  it('PENDING row vẫn có nút Approve và Reject', () => {
    const data = [makeWithdrawal({ id: 1, status: 'PENDING' })]
    render(<AdminWithdrawalTable {...defaultProps({ data })} />)
    const row = getRowContaining('Teacher A')
    expect(within(row).getByRole('button', { name: /phê/i })).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: /chối/i })).toBeInTheDocument()
  })
})

// ════════════════════════════════════════════════════════
describe('AdminWithdrawalTable — bankSnapshot: null (không có bank info)', () => {
  it('hiển thị "Chưa có bank info" khi bankSnapshot null', () => {
    const data = [makeWithdrawal({ id: 1, status: 'HOLD', bankSnapshot: null })]
    render(<AdminWithdrawalTable {...defaultProps({ data, activeStatus: 'HOLD' })} />)
    expect(screen.getByText(/chưa có thông tin ngân hàng/i)).toBeInTheDocument()
  })

  it('không có nút "Chi tiết" khi bankSnapshot null', () => {
    const data = [makeWithdrawal({ id: 1, status: 'HOLD', bankSnapshot: null })]
    render(<AdminWithdrawalTable {...defaultProps({ data, activeStatus: 'HOLD' })} />)
    expect(screen.queryByRole('button', { name: /chi tiết/i })).not.toBeInTheDocument()
  })
})

// ════════════════════════════════════════════════════════
describe('AdminWithdrawalTable — bankSnapshot: có dữ liệu', () => {
  const snapshot = JSON.stringify({
    bankName: 'Vietcombank',
    accountNumber: '1234567890',
    accountName: 'NGUYEN VAN A',
    branch: 'Chi nhánh Hà Nội',
  })

  const dataWithSnapshot = [
    makeWithdrawal({ id: 1, status: 'HOLD', bankSnapshot: snapshot }),
  ]

  it('hiển thị tên ngân hàng và nút "Chi tiết"', () => {
    render(<AdminWithdrawalTable {...defaultProps({ data: dataWithSnapshot, activeStatus: 'HOLD' })} />)
    expect(screen.getByText('Vietcombank')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /chi tiết/i })).toBeInTheDocument()
  })

  it('click "Chi tiết" → expand hiển thị đầy đủ snapshot', () => {
    render(<AdminWithdrawalTable {...defaultProps({ data: dataWithSnapshot, activeStatus: 'HOLD' })} />)
    fireEvent.click(screen.getByRole('button', { name: /chi tiết/i }))

    expect(screen.getAllByText('1234567890').length).toBeGreaterThan(0)
    expect(screen.getAllByText('NGUYEN VAN A').length).toBeGreaterThan(0)
    expect(screen.getByText('Chi nhánh Hà Nội')).toBeInTheDocument()
  })

  it('click "Ẩn" → collapse, snapshot biến mất', () => {
    render(<AdminWithdrawalTable {...defaultProps({ data: dataWithSnapshot, activeStatus: 'HOLD' })} />)

    fireEvent.click(screen.getByRole('button', { name: /chi tiết/i }))
    expect(screen.getAllByText('1234567890').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /ẩn/i }))
    expect(screen.getAllByText('1234567890').length).toBe(1)
  })

  it('expand hiển thị cảnh báo liên hệ teacher', () => {
    render(<AdminWithdrawalTable {...defaultProps({ data: dataWithSnapshot, activeStatus: 'HOLD' })} />)
    fireEvent.click(screen.getByRole('button', { name: /chi tiết/i }))
    expect(screen.getByText(/liên hệ teacher/i)).toBeInTheDocument()
  })

  it('bankSnapshot là object (không phải JSON string) vẫn parse được', () => {
    const data = [makeWithdrawal({
      id: 1, status: 'HOLD',
      bankSnapshot: { bankName: 'Techcombank', accountNumber: '9999' },
    })]
    render(<AdminWithdrawalTable {...defaultProps({ data, activeStatus: 'HOLD' })} />)
    expect(screen.getByText('Techcombank')).toBeInTheDocument()
  })
})

// ════════════════════════════════════════════════════════
describe('AdminWithdrawalTable — Approve/Reject flow (PENDING)', () => {
  // FIX (Failure 1): Scope tất cả button queries vào row cụ thể qua
  // getRowContaining() + within(). Nếu component có batch-approve button
  // hoặc render nhiều rows, getByRole('button', {name:/approve/i}) sẽ throw
  // "Found multiple elements". within(row) loại trừ tất cả buttons ngoài row.
  const data = [makeWithdrawal({ id: 7, status: 'PENDING', teacherName: 'Teacher B', amount: 2000000 })]

  it('click Approve → mở ConfirmModal với đúng thông tin', () => {
    render(<AdminWithdrawalTable {...defaultProps({ data })} />)

    const row = getRowContaining('Teacher B')
    fireEvent.click(within(row).getByRole('button', { name: /phê/i }))

    const modal = screen.getByTestId('confirm-modal')
    expect(modal).toBeInTheDocument()
    expect(modal.textContent).toMatch(/phê/i)
  })

  it('confirm Approve → gọi onApprove với đúng id', () => {
    const onApprove = vi.fn().mockResolvedValue(undefined)
    render(<AdminWithdrawalTable {...defaultProps({ data, onApprove })} />)

    const row = getRowContaining('Teacher B')
    fireEvent.click(within(row).getByRole('button', { name: /phê/i }))
    fireEvent.click(within(screen.getByTestId('confirm-modal')).getByText('Confirm'))

    expect(onApprove).toHaveBeenCalledWith(7)
  })

  it('click Reject → mở FormModal, submit → gọi onReject với id và note', () => {
    const onReject = vi.fn().mockResolvedValue(undefined)
    render(<AdminWithdrawalTable {...defaultProps({ data, onReject })} />)

    const row = getRowContaining('Teacher B')
    fireEvent.click(within(row).getByRole('button', { name: /chối/i }))

    // placeholder thực tế trong component: "Nhập lý do để giáo viên biết..."
    const textarea = screen.getByPlaceholderText(/nhập lý do để giáo viên biết/i)
    fireEvent.change(textarea, { target: { value: 'Tài khoản sai' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    expect(onReject).toHaveBeenCalledWith(7, 'Tài khoản sai')
  })
})