package vn.codemia.api.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Teacher dùng khi tạo/sửa bài tập CODE.
 * Mỗi test case = 1 input + 1 expectedOutput.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestCaseRequest {

    /** Nhãn hiển thị cho student: "Mảng rỗng trả về 0", "Mảng số âm", ... */
    private String label;

    /** stdin truyền vào khi chạy code. Null nếu không cần input. */
    private String input;

    /** Output mong đợi (trim khi so sánh) */
    private String expectedOutput;

    /**
     * true → student không thấy input/expectedOutput (chỉ biết pass/fail).
     * false → hiện đầy đủ expected vs got.
     */
    @Builder.Default
    private boolean hidden = false;
}
