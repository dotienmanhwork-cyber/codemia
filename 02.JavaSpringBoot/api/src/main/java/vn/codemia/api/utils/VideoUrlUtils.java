package vn.codemia.api.utils;

import vn.codemia.api.enums.VideoPlatform;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utility dùng chung để detect platform và extract video ID từ URL.
 * Cả TranscriptServiceImpl và VideoDurationServiceImpl đều dùng class này
 * thay vì mỗi nơi tự viết regex riêng.
 */
public class VideoUrlUtils {

	// youtu.be/ID  hoặc  watch?v=ID  hoặc  embed/ID
	private static final Pattern YOUTUBE = Pattern.compile(
			"(?:youtu\\.be/|[?&/](?:v=|embed/))([\\w-]{11})"
	);

	// vimeo.com/123456789  hoặc  player.vimeo.com/video/123456789
	private static final Pattern VIMEO = Pattern.compile(
			"vimeo\\.com/(?:video/)?(\\d+)"
	);

	public static VideoPlatform detect(String url) {
		if (url == null || url.isBlank()) return VideoPlatform.UNKNOWN;
		if (YOUTUBE.matcher(url).find())  return VideoPlatform.YOUTUBE;
		if (VIMEO.matcher(url).find())    return VideoPlatform.VIMEO;
		return VideoPlatform.UNKNOWN;
	}

	/** YouTube video ID (11 ký tự), hoặc null nếu không match. */
	public static String extractYouTubeId(String url) {
		Matcher m = YOUTUBE.matcher(url);
		return m.find() ? m.group(1) : null;
	}

	/** Vimeo video ID (số nguyên dạng String), hoặc null nếu không match. */
	public static String extractVimeoId(String url) {
		Matcher m = VIMEO.matcher(url);
		return m.find() ? m.group(1) : null;
	}
}