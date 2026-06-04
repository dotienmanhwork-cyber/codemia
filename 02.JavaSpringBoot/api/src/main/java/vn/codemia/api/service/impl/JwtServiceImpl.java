package vn.codemia.api.service.impl; // Bạn có thể đổi lại thành vn.codemia.api.service nếu muốn để cùng thư mục

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;
import vn.codemia.api.entity.User;
import vn.codemia.api.service.JwtService;

import java.security.Key;
import java.util.Date;

@Service
public class JwtServiceImpl implements JwtService {
	private final String SECRET_KEY = "DayLaKhoaBiMatCuaDuAnCodemiaDayLaKhoaBiMatCuaDuAnCodemia";

	// Thời gian sống của token: 1 ngày = 24h * 60m * 60s * 1000ms
	private final long VALIDITY_IN_MS = 1000 * 60 * 60 * 24;

	@Override
	public String generateToken(User user) {
		return Jwts.builder()
				.setSubject(user.getEmail()) // Định danh user bằng email
				.claim("role", user.getRole().name()) // Đính kèm chức vụ vào token để React biết
				.setIssuedAt(new Date(System.currentTimeMillis())) // Thời điểm tạo
				.setExpiration(new Date(System.currentTimeMillis() + VALIDITY_IN_MS)) // Thời điểm hết hạn
				.signWith(getSignInKey(), SignatureAlgorithm.HS256) // Chữ ký bảo mật
				.compact();
	}

	private Key getSignInKey() {
		byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
		return Keys.hmacShaKeyFor(keyBytes);
	}

	// Lấy Email (Subject) từ trong Token ra
	@Override
	public String extractEmail(String token) {
		return Jwts.parserBuilder()
				.setSigningKey(getSignInKey())
				.build()
				.parseClaimsJws(token)
				.getBody()
				.getSubject();
	}

	// Kiểm tra xem Token còn hợp lệ không (chưa hết hạn và đúng định dạng)
	@Override
	public boolean isTokenValid(String token) {
		try {
			Jwts.parserBuilder().setSigningKey(getSignInKey()).build().parseClaimsJws(token);
			return true;
		} catch (Exception e) {
			return false; // Thẻ giả, thẻ hết hạn, thẻ rách...
		}
	}

	@Override
	public String extractUsername(String token) {
		return extractAllClaims(token).getSubject();
	}

	private Claims extractAllClaims(String token) {
		return Jwts.parserBuilder()
				.setSigningKey(getSignInKey())
				.build()
				.parseClaimsJws(token)
				.getBody();
	}
}