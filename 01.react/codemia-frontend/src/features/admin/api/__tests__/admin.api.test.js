// src/features/admin/api/__tests__/admin.api.test.js

import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../../../../shared/config/axios'
import {
  getDowngradeImpact,
  downgradeUserRole,
  getWithdrawalRequests,
} from '../admin.api'

vi.mock('../../../../shared/config/axios', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    patch:  vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  },
}))

beforeEach(() => vi.clearAllMocks())

// ─────────────────────────────────────────────────────────
describe('getDowngradeImpact', () => {
  it('calls GET /admin/users/:id/downgrade-impact', () => {
    apiClient.get.mockResolvedValueOnce({ result: {} })
    getDowngradeImpact('42')
    expect(apiClient.get).toHaveBeenCalledWith('/admin/users/42/downgrade-impact')
  })

  it('trả về result từ BE', async () => {
    const mockResult = {
      courseCount: 3,
      activeEnrollments: 120,
      pendingWithdrawals: 1,
      pendingBalance: 500000,
    }
    apiClient.get.mockResolvedValueOnce({ result: mockResult })
    const res = await getDowngradeImpact('42')
    expect(res.result).toEqual(mockResult)
  })
})

// ─────────────────────────────────────────────────────────
describe('downgradeUserRole', () => {
  // FIX: endpoint thực tế là /downgrade (không phải /downgrade-role)
  it('calls POST /admin/users/:id/downgrade với note', () => {
    apiClient.post.mockResolvedValueOnce({ result: {} })
    downgradeUserRole('42', 'Vi phạm điều khoản')
    expect(apiClient.post).toHaveBeenCalledWith(
      '/admin/users/42/downgrade',
      { note: 'Vi phạm điều khoản' },
    )
  })

  it('gửi body rỗng nếu note undefined', () => {
    apiClient.post.mockResolvedValueOnce({ result: {} })
    downgradeUserRole('42', undefined)
    expect(apiClient.post).toHaveBeenCalledWith('/admin/users/42/downgrade', {})
  })

  it('gửi body rỗng nếu note là chuỗi rỗng', () => {
    apiClient.post.mockResolvedValueOnce({ result: {} })
    downgradeUserRole('42', '')
    expect(apiClient.post).toHaveBeenCalledWith('/admin/users/42/downgrade', {})
  })
})

// ─────────────────────────────────────────────────────────
describe('getWithdrawalRequests — hỗ trợ HOLD', () => {
  it('gửi ?status=HOLD khi filter HOLD', () => {
    apiClient.get.mockResolvedValueOnce([])
    getWithdrawalRequests('HOLD')
    expect(apiClient.get).toHaveBeenCalledWith(
      '/admin/finance/withdrawal-requests',
      { params: { status: 'HOLD' } },
    )
  })

  it('không gửi params khi filter ALL', () => {
    apiClient.get.mockResolvedValueOnce([])
    getWithdrawalRequests('ALL')
    expect(apiClient.get).toHaveBeenCalledWith(
      '/admin/finance/withdrawal-requests',
      { params: {} },
    )
  })

  it('không gửi params khi không truyền status', () => {
    apiClient.get.mockResolvedValueOnce([])
    getWithdrawalRequests()
    expect(apiClient.get).toHaveBeenCalledWith(
      '/admin/finance/withdrawal-requests',
      { params: {} },
    )
  })
})