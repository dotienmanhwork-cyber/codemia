package vn.codemia.api.dto.request;

import lombok.Data;

@Data
public class QuizQuestionRequest {
	private Integer orderIndex;
	private String questionText;
	private String optionA;
	private String optionB;
	private String optionC;
	private String optionD;
	private String correctAnswer;   // "A" | "B" | "C" | "D"
	private String explanation;
}