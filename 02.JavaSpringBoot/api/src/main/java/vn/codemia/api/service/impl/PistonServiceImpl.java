package vn.codemia.api.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import vn.codemia.api.dto.request.TestCaseRequest;
import vn.codemia.api.dto.response.RunCodeResponse;
import vn.codemia.api.service.PistonService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class PistonServiceImpl implements PistonService {

    @Value("${piston.url:http://localhost:2000}")
    private String pistonBaseUrl;

    private String getPistonUrl() {
        return pistonBaseUrl + "/api/v2/execute";
    }

    private static final Map<String, String> LANGUAGE_MAP = Map.of(
            "java",       "java",
            "python",     "python",
            "javascript", "javascript",
            "typescript", "typescript",
            "cpp",        "c++",
            "c",          "c",
            "go",         "go",
            "rust",       "rust"
    );

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public PistonServiceImpl(@Qualifier("pistonRestTemplate") RestTemplate restTemplate,
                             ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    // ── Chạy code thường (stdin/stdout) ──────────────────────────────────────
    @Override
    public RunCodeResponse execute(String code, String language,
                                   String fileName, List<TestCaseRequest> testCases) {

        String pistonLang = LANGUAGE_MAP.getOrDefault(
                language != null ? language.toLowerCase() : "java", "java");

        List<RunCodeResponse.TestCaseResult> results = new ArrayList<>();

        if (testCases == null || testCases.isEmpty()) {
            PistonResult pr = callPiston(pistonLang, fileName, code, "");
            if (pr.compileError != null) {
                return RunCodeResponse.builder()
                        .hasError(true).errorType("CompileError")
                        .errorMessage(pr.compileError).testCases(List.of()).build();
            }
            results.add(RunCodeResponse.TestCaseResult.builder()
                    .index(0).label("Test 1")
                    .passed(!pr.hasRuntimeError).actual(pr.stdout)
                    .message(pr.hasRuntimeError ? pr.stderr : null).hidden(false).build());
            return RunCodeResponse.builder().hasError(false).testCases(results).build();
        }

        for (int i = 0; i < testCases.size(); i++) {
            TestCaseRequest tc = testCases.get(i);
            String stdin = tc.getInput() != null ? tc.getInput() : "";
            PistonResult pr = callPiston(pistonLang, fileName, code, stdin);

            if (pr.compileError != null) {
                return RunCodeResponse.builder()
                        .hasError(true).errorType("CompileError")
                        .errorMessage(pr.compileError).testCases(List.of()).build();
            }

            String actual   = pr.stdout != null ? pr.stdout.trim() : "";
            String expected = tc.getExpectedOutput() != null ? tc.getExpectedOutput().trim() : "";
            boolean passed  = !pr.hasRuntimeError && actual.equals(expected);

            results.add(RunCodeResponse.TestCaseResult.builder()
                    .index(i)
                    .label(tc.getLabel() != null ? tc.getLabel() : "Test " + (i + 1))
                    .passed(passed)
                    .expected(tc.isHidden() ? null : expected)
                    .actual(tc.isHidden() ? null : actual)
                    .message(pr.hasRuntimeError ? pr.stderr : null)
                    .hidden(tc.isHidden()).build());
        }

        return RunCodeResponse.builder().hasError(false).testCases(results).build();
    }

    // ── Unit Test ─────────────────────────────────────────────────────────────
    @Override
    public RunCodeResponse executeUnitTest(String code, String testCode,
                                           String language, String fileName) {
        String pistonLang = LANGUAGE_MAP.getOrDefault(
                language != null ? language.toLowerCase() : "java", "java");

        String entryFile;
        String combined;

        if ("java".equals(pistonLang)) {
            // Vấn đề: exercise lưu fileName="Main.java" nhưng starter code là
            //         "public class BankAccount" → 2 public class trong 1 file → lỗi.
            //
            // Giải pháp:
            //   1. Strip "public" khỏi student class → "class BankAccount" (package-private)
            //   2. Ghép với teacher test (public class Main { main() })
            //   3. Gửi lên Piston với tên "Main" (KHÔNG có .java — Piston tự append)
            //
            // Kết quả file gửi đi:
            //   name: "Main"  →  Piston lưu: Main.java  →  java Main  ✅
            String strippedCode = code.replaceAll(
                    "public\\s+(class|interface|enum|record)\\s+",
                    "$1 ");
            combined  = (testCode != null ? testCode : "") + "\n\n" + strippedCode;
            entryFile = "Main"; // KHÔNG có .java — Piston tự append extension
        } else {
            combined  = code + "\n\n" + (testCode != null ? testCode : "");
            // Strip extension cho các ngôn ngữ khác cũng vậy
            entryFile = stripExtension(fileName);
        }

        PistonResult pr = callPiston(pistonLang, entryFile, combined, "");

        if (pr.compileError != null) {
            return RunCodeResponse.builder()
                    .hasError(true).errorType("CompileError")
                    .errorMessage(pr.compileError).testCases(List.of()).build();
        }

        // passed = không có runtime error VÀ stdout không chứa "FAIL:"
        // Teacher test dùng System.out.println("PASS/FAIL: ...") để báo kết quả.
        boolean hasFail = pr.stdout != null && pr.stdout.contains("FAIL:");
        boolean passed  = !pr.hasRuntimeError && !hasFail;
        String message  = pr.hasRuntimeError
                ? (pr.stderr != null ? pr.stderr : "Test thất bại")
                : (hasFail ? pr.stdout : null);

        return RunCodeResponse.builder()
                .hasError(false)
                .testCases(List.of(RunCodeResponse.TestCaseResult.builder()
                        .index(0).label("Unit Test")
                        .passed(passed).actual(pr.stdout)
                        .message(message).hidden(false).build()))
                .build();
    }

    // ── Gọi Piston API ───────────────────────────────────────────────────────
    private PistonResult callPiston(String language, String fileName,
                                    String code, String stdin) {
        try {
            // Piston tự append extension dựa vào language.
            // Nếu gửi "Main.java" → Piston lưu "Main.java.java" → java chạy sai.
            // Luôn strip extension trước khi gửi.
            String pistonName = stripExtension(fileName);

            Map<String, Object> body = Map.of(
                    "language",    language,
                    "version",     "*",
                    "files",       List.of(Map.of("name", pistonName, "content", code)),
                    "stdin",       stdin,
                    "run_timeout", 3000
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    getPistonUrl(), HttpMethod.POST, entity, String.class);

            JsonNode root = objectMapper.readTree(response.getBody());

            JsonNode compile = root.path("compile");
            if (!compile.isMissingNode() && compile.path("code").asInt(0) != 0) {
                String compileErr = compile.path("stderr").asText("");
                if (compileErr.isBlank())
                    compileErr = compile.path("output").asText("Compile error");
                return PistonResult.compileError(compileErr);
            }

            JsonNode run      = root.path("run");
            String   stdout   = run.path("stdout").asText("").trim();
            String   stderr   = run.path("stderr").asText("").trim();
            int      exitCode = run.path("code").asInt(0);

            boolean runtimeError = exitCode != 0 && !stderr.isBlank();
            return PistonResult.ok(stdout, runtimeError ? stderr : null);

        } catch (Exception e) {
            log.error("[Piston] Error calling API: {}", e.getMessage());
            return PistonResult.compileError("Không thể kết nối tới Piston. Vui lòng thử lại.");
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** "Main.java" → "Main",  "solution.py" → "solution",  "Main" → "Main" */
    private static String stripExtension(String fileName) {
        if (fileName == null) return "Main";
        int dot = fileName.lastIndexOf('.');
        return dot > 0 ? fileName.substring(0, dot) : fileName;
    }

    // ── Inner result holder ───────────────────────────────────────────────────
    private static class PistonResult {
        String  stdout;
        String  stderr;
        String  compileError;
        boolean hasRuntimeError;

        static PistonResult compileError(String msg) {
            PistonResult r = new PistonResult();
            r.compileError = msg;
            return r;
        }

        static PistonResult ok(String stdout, String runtimeErr) {
            PistonResult r = new PistonResult();
            r.stdout = stdout;
            r.stderr = runtimeErr;
            r.hasRuntimeError = runtimeErr != null;
            return r;
        }
    }
}