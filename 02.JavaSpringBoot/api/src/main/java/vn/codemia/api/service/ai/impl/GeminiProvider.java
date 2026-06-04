package vn.codemia.api.service.ai.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import vn.codemia.api.config.AiConfig;
import vn.codemia.api.service.ai.AiProvider;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiProvider implements AiProvider {

	private static final String MODEL = "gemini-2.0-flash";
	private static final String API_URL =
			"https://generativelanguage.googleapis.com/v1beta/models/"
					+ MODEL + ":generateContent?key=";

	private final AiConfig aiConfig;
	private final RestTemplate restTemplate;
	private final ObjectMapper objectMapper = new ObjectMapper();

	@Override
	public String call(String systemPrompt, String userPrompt) throws Exception {
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);

		// Gemini ghép system + user vào một turn
		String combined = systemPrompt + "\n\n" + userPrompt;
		Map<String, Object> body = Map.of(
				"contents", List.of(
						Map.of("parts", List.of(Map.of("text", combined)))
				)
		);

		String url = API_URL + aiConfig.getGeminiApiKey();
		HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
		ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

		JsonNode root = objectMapper.readTree(response.getBody());
		return root.path("candidates").get(0)
				.path("content").path("parts").get(0)
				.path("text").asText();
	}
}