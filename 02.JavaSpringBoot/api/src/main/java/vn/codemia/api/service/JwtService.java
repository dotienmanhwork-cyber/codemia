package vn.codemia.api.service;

import vn.codemia.api.entity.User;

public interface JwtService {

	String generateToken(User user);

	String extractEmail(String token);

	boolean isTokenValid(String token);

	String extractUsername(String token);
}