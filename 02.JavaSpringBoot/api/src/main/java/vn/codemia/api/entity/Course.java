package vn.codemia.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;
import vn.codemia.api.enums.CourseStatus;
import vn.codemia.api.enums.SubmissionType;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "courses")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(length = 36, nullable = false, updatable = false)
	private String id;

	@Column(nullable = false)
	private String title;

	@Column(nullable = false, unique = true)
	private String slug;

	@Column(name = "thumbnail_url", length = 500)
	private String thumbnailUrl;

	@Column(columnDefinition = "TEXT")
	private String description;

	@Column(name = "seo_tags", columnDefinition = "TEXT")
	private String seoTags;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal price;

	// ── Giá gốc trước khi giảm (để tính % discount trên UI) ──────
	@Column(name = "original_price", precision = 10, scale = 2)
	private BigDecimal originalPrice;

	// ── Đánh giá ─────────────────────────────────────────────────
	@Column(name = "rating")
	@Builder.Default
	private Double rating = 0.0;

	@Column(name = "rating_count")
	@Builder.Default
	private Integer ratingCount = 0;

	// ── Badge Bestseller ──────────────────────────────────────────
	@Column(name = "is_bestseller")
	@Builder.Default
	private Boolean isBestseller = false;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	@Builder.Default
	private CourseStatus status = CourseStatus.DRAFT;

	@Column(name = "rejected_reason", columnDefinition = "TEXT")
	private String rejectedReason;

	@Enumerated(EnumType.STRING)
	@Column(name = "submission_type")
	private SubmissionType submissionType;

	@Column(name = "old_title")
	private String oldTitle;

	@Column(name = "old_price", precision = 10, scale = 2)
	private BigDecimal oldPrice;

	@Column(name = "old_description", columnDefinition = "TEXT")
	private String oldDescription;

	@Column(name = "published_once", nullable = false)
	@Builder.Default
	private Boolean publishedOnce = false;


	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "teacher_id", nullable = false)
	private User teacher;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "category_id")
	private Category category;

	@ManyToMany(fetch = FetchType.LAZY)
	@JoinTable(
			name = "course_tags",
			joinColumns = @JoinColumn(name = "course_id"),
			inverseJoinColumns = @JoinColumn(name = "tag_id")
	)
	@Builder.Default
	private Set<Tag> tags = new HashSet<>();

	@OneToMany(mappedBy = "course", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
	@OrderBy("orderIndex ASC")
	private List<Section> sections;

	@Column(name = "learn_objectives", columnDefinition = "TEXT")
	private String learnObjectives;

	@CreationTimestamp
	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

	@Column(name = "deleted_at")
	private LocalDateTime deletedAt;
}