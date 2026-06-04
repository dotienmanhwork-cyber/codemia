package vn.codemia.api.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SubmitRequest {
	// CODE submit
	private String code;

	// QUIZ submit: key = orderIndex, value = "A"/"B"/"C"/"D"
	private Map<Integer, String> answers;
}