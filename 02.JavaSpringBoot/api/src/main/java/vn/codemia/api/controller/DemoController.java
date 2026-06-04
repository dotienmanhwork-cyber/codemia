package vn.codemia.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/demo")
public class DemoController {

	@GetMapping("/common")
	public ResponseEntity<String> common() {
		return ResponseEntity.ok("Đây là khu vực công cộng.");
	}

	@GetMapping("/admin-only")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<String> adminOnly() {
		return ResponseEntity.ok("Chào sếp! Đây là khu vực tối mật của ADMIN.");
	}

	@GetMapping("/student-only")
	@PreAuthorize("hasRole('STUDENT')")
	public ResponseEntity<String> studentOnly() {
		return ResponseEntity.ok("Chào bạn sinh viên! Đây là phòng tự học.");
	}

	// THÊM MỚI KHU VỰC DÀNH CHO GIÁO VIÊN Ở ĐÂY
	@GetMapping("/teacher-only")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<String> teacherOnly() {
		return ResponseEntity.ok("Chào thầy/cô! Đây là phòng nghỉ giáo viên.");
	}
}