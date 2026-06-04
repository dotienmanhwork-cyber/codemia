package vn.codemia.api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import vn.codemia.api.dto.response.ApiResponse;

@ControllerAdvice
public class GlobalExceptionHandler {

	// 1. Validation (@Valid) — phải đặt trước handler Exception.class
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiResponse<?>> handlingValidationException(MethodArgumentNotValidException e) {
		String message = e.getBindingResult().getFieldErrors().stream()
				.map(FieldError::getDefaultMessage)
				.findFirst()
				.orElse("Invalid request");

		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
				ApiResponse.builder()
						.code(400)
						.message(message)
						.build()
		);
	}

	// 2. Lỗi nghiệp vụ chủ động throw AppException
	@ExceptionHandler(AppException.class)
	public ResponseEntity<ApiResponse<?>> handlingAppException(AppException exception) {
		ErrorCode errorCode = exception.getErrorCode();
		return ResponseEntity.badRequest().body(
				ApiResponse.builder()
						.code(errorCode.getCode())
						.message(errorCode.getMessage())
						.build()
		);
	}

	// 3. Không có quyền truy cập
	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ApiResponse<Void>> handlingAccessDeniedException(AccessDeniedException exception) {
		ErrorCode errorCode = ErrorCode.UNAUTHORIZED;
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
				ApiResponse.<Void>builder()
						.code(errorCode.getCode())
						.message(errorCode.getMessage())
						.build()
		);
	}

	// 4. Catch-all — đặt cuối cùng
	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiResponse<?>> handlingException(Exception exception) {
		exception.printStackTrace();
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
				ApiResponse.builder()
						.code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())
						.message(exception.getMessage())
						.build()
		);
	}
}