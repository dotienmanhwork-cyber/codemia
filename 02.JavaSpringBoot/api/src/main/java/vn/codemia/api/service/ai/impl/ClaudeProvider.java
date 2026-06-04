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
public class ClaudeProvider implements AiProvider {

	private static final String API_URL = "https://api.anthropic.com/v1/messages";
	private static final String MODEL   = "claude-sonnet-4-20250514";

	private final AiConfig aiConfig;
	private final RestTemplate restTemplate;
	private final ObjectMapper objectMapper = new ObjectMapper();

	@Override
	public String call(String systemPrompt, String userPrompt) throws Exception {
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		headers.set("x-api-key", aiConfig.getAnthropicApiKey());
		headers.set("anthropic-version", "2023-06-01");

		Map<String, Object> body = Map.of(
				"model",      MODEL,
				"max_tokens", 1024,
				"system",     systemPrompt,
				"messages",   List.of(Map.of("role", "user", "content", userPrompt))
		);

		HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
		ResponseEntity<String> response = restTemplate.postForEntity(API_URL, request, String.class);

		JsonNode root = objectMapper.readTree(response.getBody());
		return root.path("content").get(0).path("text").asText();
	}
}