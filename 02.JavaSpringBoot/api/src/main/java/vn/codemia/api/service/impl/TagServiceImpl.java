package vn.codemia.api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codemia.api.dto.request.TagRequest;
import vn.codemia.api.dto.response.TagResponse;
import vn.codemia.api.entity.Tag;
import vn.codemia.api.repository.TagRepository;
import vn.codemia.api.service.TagService;
import vn.codemia.api.mapper.TagMapper;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

	private final TagRepository tagRepository;
	private final TagMapper tagMapper;

	@Override
	public List<TagResponse> getAll() {
		return tagRepository.findAll().stream()
				.map(tagMapper::toTagResponse)
				.collect(Collectors.toList());
	}

	@Override
	public TagResponse getById(Integer id) {
		Tag tag = tagRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Không tìm thấy Tag này!"));
		return tagMapper.toTagResponse(tag);
	}

	@Override
	@Transactional
	public TagResponse create(TagRequest request) {
		if (tagRepository.existsByName(request.getName())) {
			throw new RuntimeException("Tag này đã tồn tại!");
		}

		Tag tag = Tag.builder()
				.name(request.getName())
				.slug(generateSlug(request.getName()))
				.build();

		return tagMapper.toTagResponse(tagRepository.save(tag));
	}

	@Override
	@Transactional
	public TagResponse update(Integer id, TagRequest request) {
		Tag tag = tagRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Không tìm thấy Tag này!"));

		// Nếu đổi tên khác tên cũ, kiểm tra xem tên mới đã bị ai chiếm chưa
		if (!tag.getName().equalsIgnoreCase(request.getName()) &&
				tagRepository.existsByName(request.getName())) {
			throw new RuntimeException("Tên Tag này đã tồn tại!");
		}

		tag.setName(request.getName());
		tag.setSlug(generateSlug(request.getName()));

		return tagMapper.toTagResponse(tagRepository.save(tag));
	}

	@Override
	public void delete(Integer id) {
		tagRepository.deleteById(id);
	}

	// Tái sử dụng hàm tạo slug siêu xịn từ Category
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
}