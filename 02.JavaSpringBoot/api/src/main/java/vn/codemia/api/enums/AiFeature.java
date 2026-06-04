package vn.codemia.api.enums;

public enum AiFeature {
	CHAT,
	CODE_REVIEW,
	SUMMARY,
	CODE_RUN,     // dry-run: chỉ ra lỗi, không cho điểm → dùng model nhanh
	CODE_SUBMIT,  // chấm điểm code thật → dùng model mạnh hơn
	QUIZ_SUBMIT   // chấm điểm quiz thật → dùng cùng model với CODE_SUBMIT
}