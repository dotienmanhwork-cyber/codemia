package vn.codemia.api.enums;

public enum AiProviderType {
	CLAUDE,
	OPENAI,
	GEMINI,
	GROQ,         // llama-3.3-70b-versatile — dùng cho submit (mạnh hơn)
	GROQ_FAST     // llama-3.1-8b-instant    — dùng cho run   (nhanh + rẻ)
}