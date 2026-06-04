# Implementation Guide — Course Change Notifications for Enrolled Students

## Tổng quan
Khi Teacher thực hiện các thay đổi có tác động đến trải nghiệm học của Student,
hệ thống tự động tạo notification và hiển thị qua bell icon (NotifButton).

## Phạm vi thay đổi: 6 file backend

---

## FILE 1 — `EnrollmentRepository.java`

Thêm 1 method vào cuối interface, trước dấu `}`:

```java
@Query("SELECT e FROM Enrollment e WHERE e.course.id = :courseId")
List<Enrollment> findByCourseId(@Param("courseId") String courseId);
```

---

## FILE 2 — `NotificationService.java`

Thêm 1 method vào interface:

```java
package vn.codemia.api.service;

import vn.codemia.api.entity.User;

public interface NotificationService {

    void notifyUser(User user, String title, String content);

    void notifyAllAdmins(String title, String content);

    // MỚI: Gửi notification đến toàn bộ student đang enroll courseId.
    // Nếu không có student nào enroll → không làm gì, không throw exception.
    void notifyEnrolledStudents(String courseId, String title, String content);

    void markAsRead(Integer id);

    void markAllAsRead(User user);
}
```

---

## FILE 3 — `NotificationServiceImpl.java`

Thay thế toàn bộ nội dung file:

```java
package vn.codemia.api.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codemia.api.entity.Notification;
import vn.codemia.api.entity.User;
import vn.codemia.api.enums.Role;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.repository.EnrollmentRepository;   // THÊM MỚI
import vn.codemia.api.repository.NotificationRepository;
import vn.codemia.api.repository.UserRepository;
import vn.codemia.api.service.NotificationService;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository         userRepository;
    private final EnrollmentRepository   enrollmentRepository; // THÊM MỚI

    @Override
    @Transactional
    public void notifyUser(User user, String title, String content) {
        notificationRepository.save(Notification.builder()
                .user(user)
                .title(title)
                .content(content)
                .isRead(false)
                .build());
        log.info("Sent notification '{}' to user {}", title, user.getEmail());
    }

    @Override
    @Transactional
    public void notifyAllAdmins(String title, String content) {
        List<Notification> notifications = userRepository.findByRole(Role.ADMIN)
                .stream()
                .map(admin -> Notification.builder()
                        .user(admin)
                        .title(title)
                        .content(content)
                        .isRead(false)
                        .build())
                .toList();

        notificationRepository.saveAll(notifications);
        log.info("Sent notification '{}' to {} admin(s)", title, notifications.size());
    }

    // THÊM MỚI
    @Override
    @Transactional
    public void notifyEnrolledStudents(String courseId, String title, String content) {
        List<Notification> notifications = enrollmentRepository.findByCourseId(courseId)
                .stream()
                .map(enrollment -> Notification.builder()
                        .user(enrollment.getStudent())
                        .title(title)
                        .content(content)
                        .isRead(false)
                        .build())
                .toList();

        if (notifications.isEmpty()) {
            log.info("No enrolled students for courseId={}, skip notification", courseId);
            return;
        }

        notificationRepository.saveAll(notifications);
        log.info("Sent notification '{}' to {} student(s) of courseId={}",
                title, notifications.size(), courseId);
    }

    @Override
    @Transactional
    public void markAsRead(Integer id) {
        Notification notif = notificationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        notif.setRead(true);
        notificationRepository.save(notif);
    }

    @Override
    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> list = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        list.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(list);
    }
}
```

---

## FILE 4 — `LessonServiceImpl.java`

### Bước 4a — Thêm import (cùng khối import hiện tại)
```java
import vn.codemia.api.service.NotificationService;
```

### Bước 4b — Thêm field inject (cùng khối field hiện tại)
```java
private final NotificationService notificationService;
```

### Bước 4c — Sửa hàm `create()`
Tìm đúng hàm này trong file:
```java
// TRƯỚC
@Override
@Transactional
public LessonResponse create(LessonRequest request) {
    var section = sectionRepository.findById(request.getSectionId())
            .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

    checkSectionOwnership(section, getCurrentUser());

    Lesson lesson = lessonMapper.toLesson(request);
    lesson.setSection(section);

    Lesson saved = lessonRepository.save(lesson);

    triggerAsyncProcessing(saved);

    return lessonMapper.toLessonResponse(saved);
}
```

```java
// SAU
@Override
@Transactional
public LessonResponse create(LessonRequest request) {
    var section = sectionRepository.findById(request.getSectionId())
            .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

    checkSectionOwnership(section, getCurrentUser());

    Lesson lesson = lessonMapper.toLesson(request);
    lesson.setSection(section);

    Lesson saved = lessonRepository.save(lesson);

    triggerAsyncProcessing(saved);

    // THÊM MỚI: Notify enrolled students
    String courseId    = section.getCourse().getId();
    String courseTitle = section.getCourse().getTitle();
    notificationService.notifyEnrolledStudents(
            courseId,
            "Bài học mới: " + saved.getTitle(),
            "Khóa học \"" + courseTitle + "\" vừa được thêm bài học mới: \""
                    + saved.getTitle() + "\"."
    );

    return lessonMapper.toLessonResponse(saved);
}
```

### Bước 4d — Sửa hàm `delete()`
Tìm đúng hàm này trong file:
```java
// TRƯỚC
@Override
@Transactional
public void delete(Integer id) {
    Lesson lesson = lessonRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

    checkSectionOwnership(lesson.getSection(), getCurrentUser());

    lessonRepository.deleteLesson(id);
}
```

```java
// SAU
@Override
@Transactional
public void delete(Integer id) {
    Lesson lesson = lessonRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

    checkSectionOwnership(lesson.getSection(), getCurrentUser());

    // Lấy thông tin TRƯỚC khi xóa — sau khi xóa entity không còn accessible
    String courseId    = lesson.getSection().getCourse().getId();
    String courseTitle = lesson.getSection().getCourse().getTitle();
    String lessonTitle = lesson.getTitle();

    lessonRepository.deleteLesson(id);

    // THÊM MỚI: Notify enrolled students
    notificationService.notifyEnrolledStudents(
            courseId,
            "Bài học đã bị xoá",
            "Khóa học \"" + courseTitle + "\" vừa xoá bài học: \""
                    + lessonTitle + "\"."
    );
}
```

---

## FILE 5 — `SectionServiceImpl.java`

### Bước 5a — Thêm import (cùng khối import hiện tại)
```java
import vn.codemia.api.service.NotificationService;
```

### Bước 5b — Thêm field inject (cùng khối field hiện tại)
```java
private final NotificationService notificationService;
```

### Bước 5c — Sửa hàm `create()`
Tìm đúng hàm này trong file:
```java
// TRƯỚC
@Override
@Transactional
public SectionResponse create(SectionRequest request) {
    var course = courseRepository.findById(request.getCourseId())
            .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

    checkCourseOwnership(course, getCurrentUser());

    Section section = sectionMapper.toSection(request);
    section.setCourse(course);

    return sectionMapper.toSectionResponse(sectionRepository.save(section));
}
```

```java
// SAU
@Override
@Transactional
public SectionResponse create(SectionRequest request) {
    var course = courseRepository.findById(request.getCourseId())
            .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

    checkCourseOwnership(course, getCurrentUser());

    Section section = sectionMapper.toSection(request);
    section.setCourse(course);

    SectionResponse response =
            sectionMapper.toSectionResponse(sectionRepository.save(section));

    // THÊM MỚI: Notify enrolled students
    notificationService.notifyEnrolledStudents(
            course.getId(),
            "Chương mới: " + section.getTitle(),
            "Khóa học \"" + course.getTitle() + "\" vừa được thêm chương mới: \""
                    + section.getTitle() + "\"."
    );

    return response;
}
```

### Bước 5d — Sửa hàm `delete()`
Tìm đúng hàm này trong file:
```java
// TRƯỚC
@Override
@Transactional
public void delete(Integer id) {
    Section section = sectionRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

    checkCourseOwnership(section.getCourse(), getCurrentUser());

    sectionRepository.deleteById(id);
}
```

```java
// SAU
@Override
@Transactional
public void delete(Integer id) {
    Section section = sectionRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

    checkCourseOwnership(section.getCourse(), getCurrentUser());

    // Lấy thông tin TRƯỚC khi xóa — sau khi xóa entity không còn accessible
    String courseId     = section.getCourse().getId();
    String courseTitle  = section.getCourse().getTitle();
    String sectionTitle = section.getTitle();

    sectionRepository.deleteById(id);

    // THÊM MỚI: Notify enrolled students
    notificationService.notifyEnrolledStudents(
            courseId,
            "Chương đã bị xoá",
            "Khóa học \"" + courseTitle + "\" vừa xoá chương: \""
                    + sectionTitle + "\"."
    );
}
```

---

## FILE 6 — `CourseServiceImpl.java`

### Không thêm inject mới
`CourseServiceImpl` đã có sẵn `enrollmentRepository` và `notificationRepository`
inject trực tiếp — giữ nguyên pattern này, không inject `NotificationService`.

### Không sửa `delete()`
Hàm `delete()` đã có sẵn logic notify student — không đụng vào.

### Chỉ sửa `updateStatus()`
Tìm đúng hàm này trong file:
```java
// TRƯỚC
@Override
@Transactional
public CourseResponse updateStatus(String id, String status) {
    Course course = courseRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

    checkOwnership(course, getCurrentUser());

    course.setStatus(CourseStatus.valueOf(status.toUpperCase()));
    return courseMapper.toCourseResponse(courseRepository.save(course));
}
```

```java
// SAU
@Override
@Transactional
public CourseResponse updateStatus(String id, String status) {
    Course course = courseRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

    checkOwnership(course, getCurrentUser());

    CourseStatus newStatus = CourseStatus.valueOf(status.toUpperCase());
    course.setStatus(newStatus);
    CourseResponse response =
            courseMapper.toCourseResponse(courseRepository.save(course));

    // THÊM MỚI: Notify enrolled students khi course không còn accessible.
    // DRAFT và REJECTED là 2 status duy nhất làm student mất quyền truy cập
    // (không có UNPUBLISHED/LOCKED trong enum CourseStatus).
    if (newStatus == CourseStatus.DRAFT || newStatus == CourseStatus.REJECTED) {
        List<vn.codemia.api.entity.Enrollment> enrollments =
                enrollmentRepository.findByCourseId(id);
        if (!enrollments.isEmpty()) {
            List<Notification> notifs = enrollments.stream()
                    .map(e -> Notification.builder()
                            .user(e.getStudent())
                            .title("Khóa học tạm ngừng")
                            .content("Khóa học \"" + course.getTitle()
                                    + "\" tạm thời không khả dụng. "
                                    + "Vui lòng liên hệ giảng viên.")
                            .isRead(false)
                            .build())
                    .toList();
            notificationRepository.saveAll(notifs);
        }
    }

    return response;
}
```

---

## Checklist xác nhận trước khi implement

| # | File | Thay đổi | Ghi chú |
|---|---|---|---|
| 1 | `EnrollmentRepository.java` | Thêm `findByCourseId` | Thêm cuối interface |
| 2 | `NotificationService.java` | Thêm `notifyEnrolledStudents` | Thêm vào interface |
| 3 | `NotificationServiceImpl.java` | Inject `EnrollmentRepository` + implement method mới | Thay thế toàn bộ file |
| 4 | `LessonServiceImpl.java` | Inject `NotificationService`, sửa `create()` và `delete()` | Chỉ sửa 2 hàm |
| 5 | `SectionServiceImpl.java` | Inject `NotificationService`, sửa `create()` và `delete()` | Chỉ sửa 2 hàm |
| 6 | `CourseServiceImpl.java` | Chỉ sửa `updateStatus()` | Không đụng `delete()` |

## Không thay đổi gì ở frontend
Infrastructure notification (bell icon, `NotifButton.jsx`, `notification.api.js`)
đã có sẵn và hoạt động đúng — không cần thêm gì.