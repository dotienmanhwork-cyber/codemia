package vn.codemia.api.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseRequest {

    @NotNull(message = "lessonId không được để trống")
    private Integer lessonId;

    @NotBlank(message = "type không được để trống")
    private String type;

    @NotBlank(message = "title không được để trống")
    private String title;

    private String description;
    private String difficulty;

    @Min(value = 0, message = "maxScore phải >= 0")
    @Max(value = 1000, message = "maxScore phải <= 1000")
    private Integer maxScore;

    private String tag;
    private String timeEstimate;
    private List<String> requirements;

    // CODE-specific
    private String language;
    private String starterCode;
    private String fileName;

    /** Loại chấm bài: "STANDARD" | "UNIT_TEST". Mặc định STANDARD nếu để trống. */
    private String codeType;

    /** Test code do teacher nhập — chỉ dùng khi codeType = UNIT_TEST. */
    private String testCode;

    /**
     * ← THÊM MỚI: Test cases cho Piston chạy thật.
     * Teacher định nghĩa input + expectedOutput cho từng test case.
     */
    @Valid
    private List<TestCaseRequest> testCases;

    // QUIZ-specific
    @Valid
    private List<QuizQuestionRequest> questions;
}
