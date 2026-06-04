package vn.codemia.api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	// Thiết lập danh mục cha (parent_id)
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "parent_id")
	private Category parent;

	// Hỗ trợ lấy luôn danh sách các danh mục con của nó
	@OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
	private List<Category> subCategories;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false, unique = true)
	private String slug;
}