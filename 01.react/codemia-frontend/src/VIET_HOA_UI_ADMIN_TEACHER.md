# Quy định Việt hóa UI — Admin & Teacher

> **Nguyên tắc tối thượng:** Chỉ thay đổi **text hiển thị trên giao diện**. Tuyệt đối **không** sửa tên biến, tên hàm, tên file, tên prop, logic xử lý, API call, hoặc bất kỳ đoạn code thực thi nào.

---

## 1. Phạm vi áp dụng

| Thư mục | Các file cần Việt hóa |
|---|---|
| `src/features/admin/components/` | Tất cả `.jsx` |
| `src/features/admin/pages/` | Tất cả `.jsx` |
| `src/features/teacher/components/` | Tất cả `.jsx` |
| `src/features/teacher/pages/` | Tất cả `.jsx` |
| `src/shared/components/dashboard-ui/` | Tất cả `.jsx` (nếu text cứng trong đó) |
| `src/shared/utils/menu.js` | Nhãn menu sidebar/topbar |

**Không** áp dụng cho: `src/features/browse/`, `src/features/auth/`, `src/features/learning/`, `src/features/checkout/`, `src/features/ai/`, `src/features/course-detail/`, layout công khai.

---

## 2. Quy tắc chung

### 2.1 Chỉ được sửa
- Chuỗi string hiển thị trực tiếp trên UI, ví dụ:
  ```jsx
  // TRƯỚC
  <h1>Admin Dashboard</h1>
  <button>Export report</button>
  <p>System-wide monitoring and platform management.</p>

  // SAU
  <h1>Bảng điều khiển Admin</h1>
  <button>Xuất báo cáo</button>
  <p>Giám sát toàn hệ thống và quản lý nền tảng.</p>
  ```

### 2.2 Tuyệt đối không được sửa
- Tên prop, tên biến, tên hàm, tên component
- Giá trị dùng trong logic (so sánh, điều kiện, mapping key)
- Chuỗi dùng làm `value` trong `<option>`, `<select>` nếu backend phụ thuộc
- Tên route, path URL
- Tên trường API response (`.status`, `.role`, v.v.)
- Comment code
- Placeholder trong `console.log`, `alert`, `toast` nội bộ (chỉ sửa nếu toast hiển thị thẳng cho người dùng)

### 2.3 Giữ nguyên hoàn toàn
```jsx
// Ví dụ — KHÔNG đổi bất kỳ thứ gì dưới đây:
const handleExport = () => { ... }
className="admin-dashboard"
data-testid="user-table"
navigate('/admin/users')
api.get('/admin/stats')
```

---

## 3. Bảng từ điển thuật ngữ chuẩn

Dùng nhất quán các từ sau trong toàn bộ dự án:

### 3.1 Navigation & Layout

| Tiếng Anh (gốc) | Tiếng Việt (chuẩn) |
|---|---|
| Dashboard | Bảng điều khiển |
| Users | Người dùng |
| Roles | Phân quyền |
| Courses | Khóa học |
| Categories | Danh mục |
| Finance | Tài chính |
| AI Config | Cấu hình AI |
| Settings | Cài đặt |
| Back to student view | Quay lại giao diện học viên |
| Logout | Đăng xuất |

### 3.2 Admin — Trang & Tiêu đề

| Tiếng Anh (gốc) | Tiếng Việt (chuẩn) |
|---|---|
| Admin Dashboard | Bảng điều khiển Admin |
| System-wide monitoring and platform management. | Giám sát toàn hệ thống và quản lý nền tảng. |
| Export report | Xuất báo cáo |
| Total users | Tổng người dùng |
| Pending approvals | Chờ phê duyệt |
| System health | Tình trạng hệ thống |
| Monthly revenue | Doanh thu tháng |
| Role upgrade requests | Yêu cầu nâng cấp vai trò |
| System logs | Nhật ký hệ thống |
| Live | Trực tiếp |
| View all | Xem tất cả |
| pending | chờ xử lý |
| High priority | Ưu tiên cao |
| Healthy | Hoạt động tốt |

### 3.3 Admin — Bảng & Hành động

| Tiếng Anh (gốc) | Tiếng Việt (chuẩn) |
|---|---|
| User | Người dùng |
| Request | Yêu cầu |
| Time | Thời gian |
| Action | Hành động |
| Approve | Phê duyệt |
| Decline | Từ chối |
| Edit | Chỉnh sửa |
| Delete | Xóa |
| View | Xem |
| Save | Lưu |
| Cancel | Hủy |
| Search users, courses, reports… | Tìm kiếm người dùng, khóa học, báo cáo… |

### 3.4 Admin — Nhật ký hệ thống (System Logs)

| Tiếng Anh (gốc) | Tiếng Việt (chuẩn) |
|---|---|
| Security | Bảo mật |
| Billing | Thanh toán |
| System | Hệ thống |
| Yesterday | Hôm qua |
| Unusual login attempt from IP … | Phát hiện đăng nhập bất thường từ IP … |
| Monthly payouts batch completed successfully | Đã hoàn thành thanh toán hàng tháng |
| DB schema migration deployed successfully | Triển khai migration cơ sở dữ liệu thành công |
| Failed password reset attempt — user #… | Yêu cầu đặt lại mật khẩu thất bại — người dùng #… |
| Scheduled backup completed — … GB archived | Sao lưu định kỳ hoàn thành — đã lưu trữ … GB |

### 3.5 Admin — Người dùng (Users)

| Tiếng Anh (gốc) | Tiếng Việt (chuẩn) |
|---|---|
| User Management | Quản lý người dùng |
| Name | Họ tên |
| Email | Email |
| Role | Vai trò |
| Status | Trạng thái |
| Joined | Ngày tham gia |
| Active | Hoạt động |
| Inactive | Ngừng hoạt động |
| Banned | Đã khóa |
| Student | Học viên |
| Teacher | Giáo viên |
| Admin | Quản trị viên |
| Search users… | Tìm kiếm người dùng… |
| Filter by role | Lọc theo vai trò |
| Filter by status | Lọc theo trạng thái |

### 3.6 Admin — Tài chính (Finance)

| Tiếng Anh (gốc) | Tiếng Việt (chuẩn) |
|---|---|
| Finance Overview | Tổng quan tài chính |
| Total Revenue | Tổng doanh thu |
| Pending Payouts | Thanh toán đang chờ |
| Completed Payouts | Thanh toán hoàn thành |
| Monthly Breakdown | Phân tích theo tháng |
| Teacher Payouts | Thanh toán cho giáo viên |
| Withdrawal Requests | Yêu cầu rút tiền |
| Approve | Phê duyệt |
| Reject | Từ chối |
| Amount | Số tiền |
| Date | Ngày |
| Month | Tháng |

### 3.7 Admin — Khóa học (Courses)

| Tiếng Anh (gốc) | Tiếng Việt (chuẩn) |
|---|---|
| Course Management | Quản lý khóa học |
| Course Title | Tên khóa học |
| Instructor | Giáo viên |
| Students Enrolled | Số học viên |
| Price | Giá |
| Published | Đã xuất bản |
| Draft | Bản nháp |
| Pending Review | Chờ duyệt |
| Rejected | Đã từ chối |
| Search courses… | Tìm kiếm khóa học… |

### 3.8 Admin — Phân quyền (Roles)

| Tiếng Anh (gốc) | Tiếng Việt (chuẩn) |
|---|---|
| Role Management | Quản lý phân quyền |
| Role Request History | Lịch sử yêu cầu phân quyền |
| Approved | Đã phê duyệt |
| Declined | Đã từ chối |
| Pending | Đang chờ |
| Reason | Lý do |

### 3.9 Teacher — Navigation

| Tiếng Anh (gốc) | Tiếng Việt (chuẩn) |
|---|---|
| Teacher Dashboard | Bảng điều khiển Giáo viên |
| My Courses | Khóa học của tôi |
| My Students | Học viên của tôi |
| My Exercises | Bài tập của tôi |
| Finance | Tài chính |
| Back to student view | Quay lại giao diện học viên |

### 3.10 Teacher — Dashboard

| Tiếng Anh (gốc) | Tiếng Việt (chuẩn) |
|---|---|
| Total Courses | Tổng khóa học |
| Total Students | Tổng học viên |
| Total Revenue | Tổng doanh thu |
| Course Performance | Hiệu suất khóa học |
| Recent Enrollments | Đăng ký gần đây |
| Revenue Feed | Dòng doanh thu |

### 3.11 Teacher — Khóa học

| Tiếng Anh (gốc) | Tiếng Việt (chuẩn) |
|---|---|
| Create Course | Tạo khóa học |
| Edit Course | Chỉnh sửa khóa học |
| Course Info | Thông tin khóa học |
| Curriculum | Chương trình học |
| Submit for Review | Gửi để duyệt |
| Save Draft | Lưu bản nháp |
| Course Title | Tên khóa học |
| Description | Mô tả |
| Category | Danh mục |
| Price | Giá |
| Thumbnail | Ảnh bìa |
| Add Section | Thêm chương |
| Add Lesson | Thêm bài học |

### 3.12 Teacher — Bài tập (Exercises)

| Tiếng Anh (gốc) | Tiếng Việt (chuẩn) |
|---|---|
| Exercise Management | Quản lý bài tập |
| Create Exercise | Tạo bài tập |
| Edit Exercise | Chỉnh sửa bài tập |
| Exercise Title | Tên bài tập |
| Difficulty | Độ khó |
| Easy | Dễ |
| Medium | Trung bình |
| Hard | Khó |
| Language | Ngôn ngữ |
| Test Cases | Bộ test |
| Submissions | Lượt nộp bài |

### 3.13 Teacher — Học viên (Students)

| Tiếng Anh (gốc) | Tiếng Việt (chuẩn) |
|---|---|
| Student Management | Quản lý học viên |
| Progress | Tiến độ |
| Enrolled Date | Ngày đăng ký |
| Completion Rate | Tỷ lệ hoàn thành |
| Last Active | Hoạt động gần nhất |
| Search students… | Tìm kiếm học viên… |

### 3.14 Teacher — Tài chính

| Tiếng Anh (gốc) | Tiếng Việt (chuẩn) |
|---|---|
| Revenue Overview | Tổng quan doanh thu |
| Withdraw | Rút tiền |
| Withdrawal History | Lịch sử rút tiền |
| Available Balance | Số dư khả dụng |
| Pending | Đang xử lý |
| Completed | Hoàn thành |
| Failed | Thất bại |

### 3.15 Trạng thái & Thông báo chung

| Tiếng Anh (gốc) | Tiếng Việt (chuẩn) |
|---|---|
| Loading… | Đang tải… |
| No data found. | Không có dữ liệu. |
| No results found. | Không tìm thấy kết quả. |
| Something went wrong. | Đã xảy ra lỗi. |
| Try again | Thử lại |
| Confirm | Xác nhận |
| Are you sure? | Bạn có chắc không? |
| This action cannot be undone. | Hành động này không thể hoàn tác. |
| Success | Thành công |
| Error | Lỗi |
| Warning | Cảnh báo |
| ago | trước |
| today | hôm nay |
| yesterday | hôm qua |
| Showing X of Y results | Hiển thị X / Y kết quả |
| Previous | Trước |
| Next | Tiếp |
| per page | mỗi trang |

---

## 4. Quy trình thực hiện

```
1. Mở file cần sửa
2. Tìm tất cả string hiển thị UI (JSX text, placeholder, title, aria-label hiển thị)
3. Đối chiếu bảng từ điển → thay thế
4. Nếu từ chưa có trong bảng → đặt câu hỏi, KHÔNG tự ý dịch
5. Chạy lại giao diện để kiểm tra không bị vỡ layout
```

---

## 5. Các trường hợp đặc biệt

### 5.1 Template string & interpolation — chỉ dịch phần tĩnh

```jsx
// TRƯỚC
`Showing ${count} of ${total} results`

// SAU
`Hiển thị ${count} / ${total} kết quả`
//          ↑ giữ nguyên biến, chỉ dịch text xung quanh
```

### 5.2 Ternary hiển thị label — dịch cả hai nhánh

```jsx
// TRƯỚC
{isActive ? 'Active' : 'Inactive'}

// SAU
{isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
//           ↑ không đổi tên biến isActive
```

### 5.3 Object mapping label — chỉ dịch giá trị hiển thị (value), không dịch key

```jsx
// TRƯỚC
const STATUS_LABEL = {
  active: 'Active',
  inactive: 'Inactive',
  banned: 'Banned',
}

// SAU
const STATUS_LABEL = {
  active: 'Hoạt động',      // key 'active' giữ nguyên
  inactive: 'Ngừng hoạt động',
  banned: 'Đã khóa',
}
```

### 5.4 Toast / notification hiển thị cho người dùng — được phép dịch

```jsx
// TRƯỚC
toast.success('Course created successfully!')
toast.error('Failed to delete user.')

// SAU
toast.success('Tạo khóa học thành công!')
toast.error('Xóa người dùng thất bại.')
```

### 5.5 Placeholder input

```jsx
// TRƯỚC
<input placeholder="Search users, courses, reports..." />

// SAU
<input placeholder="Tìm kiếm người dùng, khóa học, báo cáo…" />
//     ↑ placeholder là text UI → được dịch
```

### 5.6 aria-label & title tooltip (hiển thị cho người dùng) — được phép dịch

```jsx
// TRƯỚC
<button aria-label="Export report" title="Export report">

// SAU
<button aria-label="Xuất báo cáo" title="Xuất báo cáo">
```

---

## 6. Checklist trước khi commit

- [ ] Không có tên biến / hàm nào bị đổi
- [ ] Không có import / export nào bị thay đổi
- [ ] Không có logic điều kiện nào bị ảnh hưởng
- [ ] Tất cả key trong object mapping được giữ nguyên
- [ ] Các biến trong template string được giữ nguyên
- [ ] Giao diện không bị vỡ layout sau khi dịch (text dài hơn tiếng Anh)
- [ ] Đã đối chiếu với bảng từ điển ở mục 3
- [ ] Các từ chưa có trong bảng đã được hỏi và thống nhất trước khi dịch

---

## 7. Từ ngữ cần thảo luận thêm (chưa chốt)

Những từ dưới đây có nhiều cách dịch — cần team thống nhất trước khi áp dụng:

| Từ gốc | Phương án 1 | Phương án 2 | Ghi chú |
|---|---|---|---|
| Lesson | Bài học | Bài giảng | |
| Section | Chương | Phần | |
| Curriculum | Chương trình học | Nội dung khóa học | |
| Enrollment | Đăng ký | Ghi danh | |
| Review (đánh giá sao) | Đánh giá | Nhận xét | |
| Review (duyệt nội dung) | Xét duyệt | Kiểm duyệt | Khác nghĩa với trên |
| Payout | Thanh toán | Chi trả | |
| Balance | Số dư | Tài khoản | |
