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
public class OpenAiProvider implements AiProvider {

	private static final String API_URL = "https://api.openai.com/v1/chat/completions";
	private static final String MODEL   = "gpt-4o";

	private final AiConfig aiConfig;
	private final RestTemplate restTemplate;
	private final ObjectMapper objectMapper = new ObjectMapper();

	@Override
	public String call(String systemPrompt, String userPrompt) throws Exception {
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		headers.setBearerAuth(aiConfig.getOpenAiApiKey());

		Map<String, Object> body = Map.of(
				"model", MODEL,
				"messages", List.of(
						Map.of("role", "system",  "content", systemPrompt),
						Map.of("role", "user",    "content", userPrompt)
				)
		);

		HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
		ResponseEntity<String> response = restTemplate.postForEntity(API_URL, request, String.class);

		JsonNode root = objectMapper.readTree(response.getBody());
		return root.path("choices").get(0).path("message").path("content").asText();
	}
}