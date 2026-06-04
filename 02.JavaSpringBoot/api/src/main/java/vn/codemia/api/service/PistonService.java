package vn.codemia.api.service;

import vn.codemia.api.dto.request.TestCaseRequest;
import vn.codemia.api.dto.response.RunCodeResponse;

import java.util.List;

/**
 * Chạy code thật qua Piston API (https://emkc.org/api/v2/piston).
 * Không phụ thuộc AI — kết quả deterministic 100%.
 */
public interface PistonService {

    /**
     * Chạy code với danh sách test cases (STANDARD — stdin/stdout).
     *
     * @param code       Source code của student
     * @param language   "java" | "python" | "javascript" | "typescript" | "cpp" | ...
     * @param fileName   Tên file, e.g. "Main.java"
     * @param testCases  Danh sách test cases (input + expectedOutput)
     * @return           Kết quả từng test case
     */
    RunCodeResponse execute(String code, String language, String fileName,
                            List<TestCaseRequest> testCases);

    /**
     * Chạy code theo kiểu UNIT_TEST — ghép studentCode + testCode vào 1 file rồi chạy.
     * Test code do teacher viết (JUnit-style hoặc assert thủ công).
     * Bài đạt khi chương trình exit code = 0 và không có stderr.
     *
     * @param code       Source code của student
     * @param testCode   Test code của teacher (được append vào sau student code)
     * @param language   "java" | "python" | ...
     * @param fileName   Tên file, e.g. "Main.java"
     * @return           Kết quả chạy (passed = exit 0 + no stderr)
     */
    RunCodeResponse executeUnitTest(String code, String testCode,
                                    String language, String fileName);
}
