package vn.codemia.api.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.codemia.api.dto.response.CartItemResponse;
import vn.codemia.api.entity.CartItem;

@Mapper(componentModel = "spring")
public interface CartItemMapper {

	@Mapping(target = "courseId",            source = "course.id")
	@Mapping(target = "courseTitle",         source = "course.title")
	@Mapping(target = "courseThumbnailUrl",  source = "course.thumbnailUrl")
	@Mapping(target = "coursePrice",         source = "course.price")

	// ── Các field bổ sung ──────────────────────────────────────────
	@Mapping(target = "courseOriginalPrice", source = "course.originalPrice")
	@Mapping(target = "courseRating",        source = "course.rating")
	@Mapping(target = "courseRatingCount",   source = "course.ratingCount")
	@Mapping(target = "isBestseller",        source = "course.isBestseller")

	// MapStruct hỗ trợ nested path — tự động null-safe khi teacher == null
	@Mapping(target = "instructorName",      source = "course.teacher.username")

	CartItemResponse toCartItemResponse(CartItem cartItem);
}