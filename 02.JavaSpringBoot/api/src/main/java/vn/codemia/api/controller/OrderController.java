package vn.codemia.api.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.codemia.api.config.VNPAYConfig;
import vn.codemia.api.dto.response.ApiResponse;
import vn.codemia.api.entity.Order;
import vn.codemia.api.service.OrderService;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

	private final OrderService orderService;

	@PostMapping("/checkout")
	public ResponseEntity<ApiResponse<String>> checkout(HttpServletRequest request) throws Exception {
		Order order = orderService.createOrderFromCart();

		String vnp_TxnRef = order.getId();
		String vnp_IpAddr = VNPAYConfig.getIpAddress(request);

		Map<String, String> vnp_Params = new HashMap<>();
		vnp_Params.put("vnp_Version",    "2.1.0");
		vnp_Params.put("vnp_Command",    "pay");
		vnp_Params.put("vnp_TmnCode",    VNPAYConfig.vnp_TmnCode);
		vnp_Params.put("vnp_Amount",     String.valueOf(order.getTotalAmount().longValue() * 100));
		vnp_Params.put("vnp_CurrCode",   "VND");
		vnp_Params.put("vnp_TxnRef",     vnp_TxnRef);
		vnp_Params.put("vnp_OrderInfo",  "Thanh toan don hang " + vnp_TxnRef);
		vnp_Params.put("vnp_OrderType",  "other");
		vnp_Params.put("vnp_Locale",     "vn");
		vnp_Params.put("vnp_ReturnUrl",  VNPAYConfig.vnp_ReturnUrl);
		vnp_Params.put("vnp_IpAddr",     vnp_IpAddr);

		Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
		SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
		vnp_Params.put("vnp_CreateDate", formatter.format(cld.getTime()));
		cld.add(Calendar.MINUTE, 15);
		vnp_Params.put("vnp_ExpireDate", formatter.format(cld.getTime()));

		// Sort theo alphabet
		List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
		Collections.sort(fieldNames);

		StringBuilder hashData = new StringBuilder();
		StringBuilder query    = new StringBuilder();
		Iterator<String> itr   = fieldNames.iterator();

		while (itr.hasNext()) {
			String fieldName  = itr.next();
			String fieldValue = vnp_Params.get(fieldName);
			if (fieldValue != null && fieldValue.length() > 0) {
				String encodedValue = URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString());

				// ✅ ĐÚNG theo VNPAY official demo:
				//    hashData → key RAW, value ENCODED
				//    query    → key ENCODED, value ENCODED
				hashData.append(fieldName).append('=').append(encodedValue);
				query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()))
						.append('=').append(encodedValue);

				if (itr.hasNext()) {
					hashData.append('&');
					query.append('&');
				}
			}
		}

		String vnp_SecureHash = VNPAYConfig.hmacSHA512(VNPAYConfig.vnp_HashSecret, hashData.toString());
		String paymentUrl = VNPAYConfig.vnp_PayUrl + "?" + query + "&vnp_SecureHash=" + vnp_SecureHash;

		return ResponseEntity.ok(
				ApiResponse.<String>builder()
						.result(paymentUrl)
						.message("Thành công! Vui lòng chuyển hướng đến trang thanh toán.")
						.build()
		);
	}

	private static final String FE_PAYMENT_RESULT_URL = "http://localhost:5173/payment/result";

	@GetMapping("/vnpay-callback")
	public void paymentCallback(HttpServletRequest request, HttpServletResponse response) throws Exception {
		try {
			Map<String, String> fields = new HashMap<>();
			for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements();) {
				String fieldName  = params.nextElement();
				String fieldValue = request.getParameter(fieldName);
				if (fieldValue != null && fieldValue.length() > 0) {
					fields.put(fieldName, fieldValue);
				}
			}

			String vnp_SecureHash = request.getParameter("vnp_SecureHash");
			fields.remove("vnp_SecureHashType");
			fields.remove("vnp_SecureHash");

			List<String> fieldNames = new ArrayList<>(fields.keySet());
			Collections.sort(fieldNames);
			StringBuilder hashData = new StringBuilder();
			Iterator<String> itr   = fieldNames.iterator();

			while (itr.hasNext()) {
				String fieldName  = itr.next();
				String fieldValue = fields.get(fieldName);
				if (fieldValue != null && fieldValue.length() > 0) {
					// ✅ Nhất quán với checkout: key RAW, value ENCODED
					hashData.append(fieldName).append('=')
							.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
					if (itr.hasNext()) hashData.append('&');
				}
			}

			String signValue = VNPAYConfig.hmacSHA512(VNPAYConfig.vnp_HashSecret, hashData.toString());

			if (signValue.equals(vnp_SecureHash)) {
				boolean isSuccess = "00".equals(request.getParameter("vnp_ResponseCode"));
				String orderId    = request.getParameter("vnp_TxnRef");
				orderService.processVnPayCallback(orderId, isSuccess);
				response.sendRedirect(FE_PAYMENT_RESULT_URL + "?" + request.getQueryString());
			} else {
				response.sendRedirect(FE_PAYMENT_RESULT_URL + "?vnp_ResponseCode=97&error=invalid_signature");
			}
		} catch (Exception e) {
			response.sendRedirect(FE_PAYMENT_RESULT_URL + "?vnp_ResponseCode=99&error=server_error");
		}
	}
}