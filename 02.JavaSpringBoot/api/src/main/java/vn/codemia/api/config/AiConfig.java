package vn.codemia.api.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AiConfig {

	// Dùng ":" để set default = empty string → app không crash khi key chưa có
	@Value("${ai.anthropic.api-key:}")
	private String anthropicApiKey;

	@Value("${ai.openai.api-key:}")
	private String openAiApiKey;

	@Value("${ai.gemini.api-key:}")
	private String geminiApiKey;

	@Value("${ai.groq.api-key}")   // Groq là key duy nhất bắt buộc hiện tại
	private String groqApiKey;

	// Default RestTemplate — dùng cho AI providers, Transcript
	@Bean
	public RestTemplate restTemplate() {
		SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
		factory.setConnectTimeout(10_000);
		factory.setReadTimeout(15_000);
		return new RestTemplate(factory);
	}

	// Piston RestTemplate — timeout dài hơn vì Java JVM startup chậm
	@Bean
	@Qualifier("pistonRestTemplate")
	public RestTemplate pistonRestTemplate() {
		SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
		factory.setConnectTimeout(10_000);
		factory.setReadTimeout(30_000);
		return new RestTemplate(factory);
	}

	public String getAnthropicApiKey() { return anthropicApiKey; }
	public String getOpenAiApiKey()    { return openAiApiKey; }
	public String getGeminiApiKey()    { return geminiApiKey; }
	public String getGroqApiKey()      { return groqApiKey; }
}