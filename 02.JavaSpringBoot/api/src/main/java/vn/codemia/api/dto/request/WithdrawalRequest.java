package vn.codemia.api.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class WithdrawalRequest {

	// Số tiền teacher muốn rút
	private BigDecimal amount;
}