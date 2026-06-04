package vn.codemia.api.dto.response;

import lombok.*;

import java.util.List;

/**
 * Response cho /run endpoint.
 * Thay thế format AI cũ bằng kết quả thực từ Piston.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RunCodeResponse {

    /** true nếu có compile error hoặc runtime error nghiêm trọng */
    private boolean hasError;

    /** "CompileError" | "RuntimeError" — chỉ set khi hasError=true */
    private String errorType;

    /** Nội dung lỗi — compile stderr hoặc exception message */
    private String errorMessage;

    /** Kết quả từng test case */
    private List<TestCaseResult> testCases;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestCaseResult {

        /** 0-based index */
        private int index;

        /** Label hiển thị: "Mảng rỗng", "Test 1", ... */
        private String label;

        /** true nếu actual.equals(expected) */
        private boolean passed;

        /** Output mong đợi — null nếu hidden=true */
        private String expected;

        /** Output thực tế từ Piston — null nếu hidden=true */
        private String actual;

        /** Runtime error message nếu có */
        private String message;

        /** true → student chỉ thấy pass/fail, không thấy expected/actual */
        private boolean hidden;
    }
}
