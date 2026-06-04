package vn.codemia.api;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GenHashTest {
	public static void main(String[] args) {
		String hash = new BCryptPasswordEncoder().encode("tienmanh@gmail.com");
		System.out.println("HASH: " + hash);
	}
}