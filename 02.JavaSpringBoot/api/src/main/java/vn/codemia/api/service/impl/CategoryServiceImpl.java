package vn.codemia.api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codemia.api.dto.request.CategoryDeleteRequest;
import vn.codemia.api.dto.request.CategoryRequest;
import vn.codemia.api.dto.response.CategoryResponse;
import vn.codemia.api.dto.response.CategoryUsageResponse;
import vn.codemia.api.entity.Category;
import vn.codemia.api.entity.Course;
import vn.codemia.api.entity.User;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.mapper.CategoryMapper;
import vn.codemia.api.repository.CategoryRepository;
import vn.codemia.api.repository.CourseRepository;
import vn.codemia.api.service.CategoryService;
import vn.codemia.api.service.NotificationService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

	private final CategoryRepository  categoryRepository;
	private final CourseRepository    courseRepository;
	private final CategoryMapper      categoryMapper;
	private final NotificationService notificationService;

	// ──────────────────────────────────────────────────────────────
	// CREATE
	// ──────────────────────────────────────────────────────────────

	@Override
	@Transactional
	public CategoryResponse create(CategoryRequest request) {
		if (categoryRepository.existsByName(request.getName())) {
			throw new AppException(ErrorCode.CATEGORY_EXISTED);
		}

		Category category = Category.builder()
				.name(request.getName())
				.slug(generateSlug(request.getName()))
				.build();

		if (request.getParentId() != null) {
			Category parent = categoryRepository.findById(request.getParentId())
					.orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));
			category.setParent(parent);
		}

		return mapToResponse(categoryRepository.save(category));
	}

	// ──────────────────────────────────────────────────────────────
	// READ
	// ──────────────────────────────────────────────────────────────

	@Override
	public List<CategoryResponse> getAllTree() {
		return categoryRepository.findByParentIsNull().stream()
				.map(categoryMapper::toCategoryResponse)
				.collect(Collectors.toList());
	}

	@Override
	public CategoryResponse getById(Integer id) {
		Category category = categoryRepository.findById(id)
				.orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));
		return categoryMapper.toCategoryResponse(category);
	}

	@Override
	public CategoryUsageResponse getUsage(Integer id) {
		Category category = categoryRepository.findById(id)
				.orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));

		long total = countCoursesRecursive(category);

		return CategoryUsageResponse.builder()
				.categoryId(category.getId())
				.categoryName(category.getName())
				.courseCount(total)
				.hasChildren(category.getSubCategories() != null
						&& !category.getSubCategories().isEmpty())
				.build();
	}

	// ──────────────────────────────────────────────────────────────
	// UPDATE
	// ──────────────────────────────────────────────────────────────

	@Override
	@Transactional
	public CategoryResponse update(Integer id, CategoryRequest request) {
		Category category = categoryRepository.findById(id)
				.orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));

		category.setName(request.getName());
		category.setSlug(generateSlug(request.getName()));

		if (request.getParentId() != null) {
			Category parent = categoryRepository.findById(request.getParentId())
					.orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));
			category.setParent(parent);
		} else {
			category.setParent(null);
		}

		return mapToResponse(categoryRepository.save(category));
	}

	// ──────────────────────────────────────────────────────────────
	// DELETE
	// ──────────────────────────────────────────────────────────────

	@Override
	@Transactional
	public void delete(Integer id, CategoryDeleteRequest request) {
		Category category = categoryRepository.findById(id)
				.orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));

		// 1. Đếm tổng course bị ảnh hưởng (category + toàn bộ subcategory)
		long courseCount = countCoursesRecursive(category);

		if (courseCount > 0) {
			// 2a. Không có targetCategoryId → chặn, throw 1031
			if (request == null || request.getTargetCategoryId() == null) {
				throw new AppException(ErrorCode.CATEGORY_HAS_COURSES);
			}

			Integer targetId = request.getTargetCategoryId();
			if (targetId.equals(id)) {
				throw new AppException(ErrorCode.CATEGORY_NOT_EXISTED);
			}

			Category target = categoryRepository.findById(targetId)
					.orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));

			// 2b. Thu thập teacher + course titles TRƯỚC khi reassign
			//     để notification có đủ thông tin (tên course, tên category cũ/mới)
			Map<User, List<String>> affectedTeachers = new HashMap<>();
			collectAffectedTeachers(category, affectedTeachers);

			// 2c. Bulk reassign: category này + toàn bộ subcategory
			courseRepository.reassignCategory(id, target);
			if (category.getSubCategories() != null) {
				for (Category child : category.getSubCategories()) {
					courseRepository.reassignCategory(child.getId(), target);
				}
			}

			// 2d. Gửi 1 notification per teacher (gộp tất cả course bị ảnh hưởng)
			notifyAffectedTeachers(affectedTeachers, category.getName(), target.getName());
		}

		// 3. Xóa category (cascade = ALL xóa luôn subcategories)
		categoryRepository.deleteById(id);
	}

	// ──────────────────────────────────────────────────────────────
	// Notification helpers
	// ──────────────────────────────────────────────────────────────

	/**
	 * Duyệt đệ quy category tree, gom courses theo teacher.
	 * Key = Teacher entity, Value = list tên course bị ảnh hưởng.
	 */
	private void collectAffectedTeachers(Category category, Map<User, List<String>> map) {
		List<Course> courses = courseRepository.findAllByCategoryIdWithTeacher(category.getId());
		for (Course course : courses) {
			map.computeIfAbsent(course.getTeacher(), k -> new ArrayList<>())
					.add(course.getTitle());
		}
		if (category.getSubCategories() != null) {
			for (Category child : category.getSubCategories()) {
				collectAffectedTeachers(child, map);
			}
		}
	}

	/**
	 * Gửi 1 notification/teacher, không spam nhiều notification cho cùng 1 người.
	 *
	 * Ví dụ nội dung (teacher có 2 course bị ảnh hưởng):
	 *   Title  : "Danh mục khóa học đã thay đổi"
	 *   Content: 2 khóa học của bạn đã được chuyển từ "Lập trình Web"
	 *            sang "Công nghệ thông tin" bởi Admin:
	 *            • React Nâng Cao
	 *            • Node.js Căn Bản
	 */
	private void notifyAffectedTeachers(Map<User, List<String>> affectedTeachers,
	                                    String oldCategoryName,
	                                    String newCategoryName) {
		for (Map.Entry<User, List<String>> entry : affectedTeachers.entrySet()) {
			User teacher         = entry.getKey();
			List<String> titles  = entry.getValue();
			int count            = titles.size();

			String title = "Danh mục khóa học đã thay đổi";

			String courseList = titles.stream()
					.map(t -> "• " + t)
					.collect(Collectors.joining("\n"));

			String content = String.format(
					"%d khóa học của bạn đã được Admin chuyển từ danh mục \"%s\" sang \"%s\":\n%s",
					count, oldCategoryName, newCategoryName, courseList
			);

			notificationService.notifyUser(teacher, title, content);
		}
	}

	// ──────────────────────────────────────────────────────────────
	// Generic helpers
	// ──────────────────────────────────────────────────────────────

	private long countCoursesRecursive(Category category) {
		long count = courseRepository.countByCategoryId(category.getId());
		if (category.getSubCategories() != null) {
			for (Category child : category.getSubCategories()) {
				count += countCoursesRecursive(child);
			}
		}
		return count;
	}

	private String generateSlug(String name) {
		return name.toLowerCase()
				.replaceAll("á|à|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ", "a")
				.replaceAll("é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ", "e")
				.replaceAll("í|ì|ỉ|ĩ|ị", "i")
				.replaceAll("ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ", "o")
				.replaceAll("ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự", "u")
				.replaceAll("ý|ỳ|ỷ|ỹ|ỵ", "y")
				.replaceAll("đ", "d")
				.replaceAll("[^a-z0-9 ]", "")
				.replaceAll("\\s+", "-");
	}

	private CategoryResponse mapToResponse(Category category) {
		return CategoryResponse.builder()
				.id(category.getId())
				.name(category.getName())
				.slug(category.getSlug())
				.children(category.getSubCategories() != null
						? category.getSubCategories().stream()
						  .map(this::mapToResponse)
						  .collect(Collectors.toList())
						: null)
				.build();
	}
}