package vn.codemia.api.dto.request;

import lombok.Data;
import vn.codemia.api.enums.Role;

@Data
public class RegisterRequest {
	private String email;
	private String password;
	private String fullName;
}