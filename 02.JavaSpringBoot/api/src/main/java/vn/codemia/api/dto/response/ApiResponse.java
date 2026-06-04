package vn.codemia.api.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL) // Cái nào null thì không hiện ra JSON
public class ApiResponse<T> {
	int code = 1000; // Mặc định 1000 là thành công
	String message;
	T result;
}