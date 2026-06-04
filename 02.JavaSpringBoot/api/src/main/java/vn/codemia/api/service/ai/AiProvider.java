package vn.codemia.api.service.ai;

/**
 * Contract chung cho mọi AI provider.
 * Mỗi provider implement interface này, AiServiceImpl gọi theo thứ tự fallback.
 */
public interface AiProvider {

	/**
	 * Gửi prompt và nhận phản hồi thuần text.
	 * @param systemPrompt  ngữ cảnh/hành vi của AI
	 * @param userPrompt    nội dung người dùng gửi
	 * @return              text response từ model
	 * @throws Exception    khi gọi API thất bại (timeout, rate limit, 5xx...)
	 */
	String call(String systemPrompt, String userPrompt) throws Exception;
}