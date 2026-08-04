<?php
/*
Plugin Name: FND Bookings API
Description: Custom post type and REST API for First Night Diary bookings.
Version: 0.1.1
Author: LD
*/

if (!defined('ABSPATH')) exit;

add_action('init', function () {
    register_post_type('fnd_booking', [
        'label' => 'FND Bookings',
        'labels' => [
            'name' => 'FND Bookings',
            'singular_name' => 'FND Booking',
            'menu_name' => 'FND Bookings',
        ],
        'public' => false,
        'show_ui' => true,
        'show_in_menu' => true,
        'supports' => ['title', 'custom-fields'],
        'show_in_rest' => true,
        'menu_icon' => 'dashicons-calendar-alt',
    ]);

    $meta_keys = [
        'date',
        'date_ms',
        'day',
        'p',
        'venue',
        'ukt_venue',
        'affiliate_venue',
        'other_venue',
        'venue_is_tba',
        'solt_member_non_solt_venue',
        'title_of_show',
        'show_title_is_tba',
        'producer',
        'press_contact',
        'date_bkd',
        'is_season_gala',
        'is_opera_dance',
        'user_id',
        'time_stamp',
        'created_at'
    ];

    foreach ($meta_keys as $key) {
        register_post_meta('fnd_booking', $key, [
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true,
            'sanitize_callback' => null,
            'auth_callback' => function () {
                return current_user_can('edit_posts');
            }
        ]);
    }

    register_post_type('fnd_log', [
        'label' => 'Booking Logs',
        'public' => false,
        'show_ui' => true,
        'show_in_rest' => false,
        'show_in_menu' => 'edit.php?post_type=fnd_booking',
        'supports' => ['title', 'editor'],
        'menu_icon' => 'dashicons-media-text',
    ]);

    register_post_type('fnd_notification', [
        'label' => 'Booking Notifications',
        'public' => false,
        'show_ui' => false,
        'show_in_rest' => false,
        'supports' => ['title'],
    ]);

    register_post_meta('fnd_log', '_fnd_log_entry', [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => false,
        'auth_callback' => function () {
            return current_user_can('edit_posts');
        },
    ]);

    $notification_meta_keys = [
        '_fnd_booking_id',
        '_fnd_notification_type',
        '_fnd_recipient_email',
        '_fnd_subject',
        '_fnd_status',
        '_fnd_provider',
        '_fnd_provider_message_id',
        '_fnd_error_message',
        '_fnd_trigger',
        '_fnd_created_at',
        '_fnd_sent_at',
    ];

    foreach ($notification_meta_keys as $key) {
        register_post_meta('fnd_notification', $key, [
            'type' => 'string',
            'single' => true,
            'show_in_rest' => false,
            'auth_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);
    }
});

function fnd_bool_int($v)
{
    if (is_bool($v)) return $v ? 1 : 0;
    if (is_numeric($v)) return intval($v) ? 1 : 0;
    $s = strtolower(trim((string)$v));
    return in_array($s, ['1', 'y', 'yes', 'true', 'on'], true) ? 1 : 0;
}

function fnd_should_skip_clash_webhook()
{
    return !empty($GLOBALS['fnd_skip_clash_webhook']);
}

function fnd_should_preserve_timestamps()
{
    return !empty($GLOBALS['fnd_preserve_timestamps']);
}

function fnd_should_skip_log()
{
    return !empty($GLOBALS['fnd_skip_log']);
}

function fnd_get_clash_webhook_config()
{
    $url = defined('FND_CLASH_WEBHOOK_URL') ? FND_CLASH_WEBHOOK_URL : '';
    $secret = defined('FND_CLASH_WEBHOOK_SECRET') ? FND_CLASH_WEBHOOK_SECRET : '';
    return [$url, $secret];
}

function fnd_get_frontend_diary_url()
{
    if (defined('FND_FRONTEND_DIARY_URL')) {
        return FND_FRONTEND_DIARY_URL;
    }
    return 'https://solt.co.uk/first-night-diary';
}

function fnd_frontend_url_with_date($date_str)
{
    $base = rtrim(fnd_get_frontend_diary_url(), '/');
    $raw = '';
    if (preg_match('/^(\\d{2})\\/(\\d{2})\\/(\\d{4})$/', $date_str, $m)) {
        $raw = sprintf('%04d-%02d-%02d', intval($m[3]), intval($m[2]), intval($m[1]));
    } elseif (preg_match('/^(\\d{4})-(\\d{2})-(\\d{2})$/', $date_str, $m)) {
        $raw = $date_str;
    }
    if ($raw === '') return $base;
    $sep = strpos($base, '?') === false ? '?' : '&';
    return $base . $sep . 'selectedDate=' . rawurlencode($raw);
}

function fnd_tba_reminders_enabled()
{
    $opt = get_option('fnd_tba_reminders_enabled', '0');
    return $opt === '1' || $opt === 1 || $opt === true;
}

function fnd_get_tba_webhook_config()
{
    $secret = defined('FND_CLASH_WEBHOOK_SECRET') ? FND_CLASH_WEBHOOK_SECRET : '';
    if (defined('FND_TBA_WEBHOOK_URL')) {
        return [FND_TBA_WEBHOOK_URL, $secret];
    }
    if (defined('FND_CLASH_WEBHOOK_URL')) {
        $clash = FND_CLASH_WEBHOOK_URL;
        // Attempt to derive sibling route
        $derived = str_replace('/api/clash/wp', '/api/reminder/tba/wp', $clash);
        return [$derived, $secret];
    }
    return ['', ''];
}

function fnd_get_pencil_webhook_config()
{
    $secret = defined('FND_CLASH_WEBHOOK_SECRET') ? FND_CLASH_WEBHOOK_SECRET : '';
    if (defined('FND_PENCIL_WEBHOOK_URL')) {
        return [FND_PENCIL_WEBHOOK_URL, $secret];
    }
    if (defined('FND_CLASH_WEBHOOK_URL')) {
        $clash = FND_CLASH_WEBHOOK_URL;
        $derived = str_replace('/api/clash/wp', '/api/pencil/wp', $clash);
        return [$derived, $secret];
    }
    return ['', ''];
}

function fnd_get_booking_snapshot($post_id)
{
    $date = get_post_meta($post_id, 'date', true);
    if ($date && preg_match('/^\d{8}$/', $date)) {
        $year = substr($date, 0, 4);
        $month = substr($date, 4, 2);
        $day = substr($date, 6, 2);
        $date = sprintf('%04d-%02d-%02d', $year, $month, $day);
    } elseif ($date && preg_match('/^\d+$/', $date)) {
        $ms = strlen($date) >= 13 ? (int) $date : ((int) $date) * 1000;
        $date = fnd_date_str_from_ms($ms);
    }
    if (!$date) {
        $ms = get_post_meta($post_id, 'date_ms', true);
        if ($ms) $date = fnd_date_str_from_ms($ms);
    }

    return [
        'bookingId' => $post_id,
        'date' => $date,
        'booking' => [
            'id' => $post_id,
            'bookingId' => $post_id,
            'pressContact' => get_post_meta($post_id, 'press_contact', true),
            'titleOfShow' => get_post_meta($post_id, 'title_of_show', true),
            'showTitleIsTba' => fnd_bool_int(get_post_meta($post_id, 'show_title_is_tba', true)),
            'venue' => get_post_meta($post_id, 'venue', true),
            'uktVenue' => get_post_meta($post_id, 'ukt_venue', true),
            'affiliateVenue' => get_post_meta($post_id, 'affiliate_venue', true),
            'otherVenue' => get_post_meta($post_id, 'other_venue', true),
            'venueIsTba' => fnd_bool_int(get_post_meta($post_id, 'venue_is_tba', true)),
            'soltMemberNonSoltVenue' => fnd_bool_int(get_post_meta($post_id, 'solt_member_non_solt_venue', true)),
            'isSeasonGala' => fnd_bool_int(get_post_meta($post_id, 'is_season_gala', true)),
            'isOperaDance' => fnd_bool_int(get_post_meta($post_id, 'is_opera_dance', true)),
        ],
    ];
}

function fnd_send_clash_webhook($post_id, $trigger = 'booking_created')
{
    if (fnd_should_skip_clash_webhook()) return;

    [$url, $secret] = fnd_get_clash_webhook_config();
    if (!$url || !$secret) {
        error_log('FND clash webhook not configured.');
        return;
    }

    $payload = fnd_get_booking_snapshot($post_id);
    $payload['trigger'] = sanitize_key($trigger);
    if (empty($payload['date'])) {
        error_log('FND clash webhook skipped: missing date.');
        return;
    }

    $response = wp_remote_post($url, [
        'timeout' => 10,
        'headers' => [
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $secret,
        ],
        'body' => wp_json_encode($payload),
    ]);

    if (is_wp_error($response)) {
        error_log('FND clash webhook failed: ' . $response->get_error_message());
        return;
    }

    $code = wp_remote_retrieve_response_code($response);
    if ($code < 200 || $code >= 300) {
        error_log('FND clash webhook returned HTTP ' . $code);
    }
}

function fnd_send_pencil_confirmed_webhook($post_id)
{
    if (fnd_should_skip_clash_webhook()) return;

    [$url, $secret] = fnd_get_pencil_webhook_config();
    if (!$url || !$secret) {
        error_log('FND pencil webhook not configured.');
        return;
    }

    $payload = fnd_get_booking_snapshot($post_id);
    if (empty($payload['date'])) {
        error_log('FND pencil webhook skipped: missing date.');
        return;
    }

    $response = wp_remote_post($url, [
        'timeout' => 10,
        'headers' => [
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $secret,
        ],
        'body' => wp_json_encode($payload),
    ]);

    if (is_wp_error($response)) {
        error_log('FND pencil webhook failed: ' . $response->get_error_message());
        return;
    }

    $code = wp_remote_retrieve_response_code($response);
    if ($code < 200 || $code >= 300) {
        error_log('FND pencil webhook returned HTTP ' . $code);
    }
}

// Helpers to ensure date values are always normalized to the site's timezone (UK)
function fnd_wp_tz()
{
    if (function_exists('wp_timezone')) return wp_timezone();
    $tz = get_option('timezone_string');
    return new DateTimeZone($tz ? $tz : 'UTC');
}

function fnd_normalize_ms_to_site_midnight($input)
{
    $tz = fnd_wp_tz();
    // Normalize strings first to catch formats precisely
    if (is_string($input)) {
        $s = trim($input);
        if ($s === '') {
            $dt = new DateTimeImmutable('now', $tz);
        } elseif (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $s, $m)) { // Y-m-d
            $dt = new DateTimeImmutable("{$m[1]}-{$m[2]}-{$m[3]} 00:00:00", $tz);
        } elseif (preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $s, $m)) { // d/m/Y
            $dt = new DateTimeImmutable("{$m[3]}-{$m[2]}-{$m[1]} 00:00:00", $tz);
        } elseif (preg_match('/^(\d{8})$/', $s)) { // Ymd (exactly 8 digits)
            $y = substr($s, 0, 4);
            $mm = substr($s, 4, 2);
            $d = substr($s, 6, 2);
            $dt = new DateTimeImmutable("{$y}-{$mm}-{$d} 00:00:00", $tz);
        } elseif (preg_match('/^\d+$/', $s)) { // all digits -> seconds or ms
            $len = strlen($s);
            if ($len >= 13) { // ms
                $sec = (int) floor(((int)$s) / 1000);
            } elseif ($len >= 10) { // seconds
                $sec = (int) $s;
            } else { // too short -> treat as seconds anyway
                $sec = (int) $s;
            }
            $dt = (new DateTimeImmutable('@' . $sec))->setTimezone($tz);
        } else {
            $t = strtotime($s);
            $dt = $t === false ? new DateTimeImmutable('now', $tz) : (new DateTimeImmutable('@' . $t))->setTimezone($tz);
        }
    } else { // numeric or DateTime
        $num = (float)$input;
        // Heuristic for ms vs seconds
        $sec = ($num >= 1e12) ? (int) round($num / 1000) : (int) round($num);
        $dt = (new DateTimeImmutable('@' . $sec))->setTimezone($tz);
    }
    $ymd = $dt->format('Y-m-d');
    $mid = new DateTimeImmutable($ymd . ' 00:00:00', $tz);
    return $mid->getTimestamp() * 1000;
}

function fnd_format_ddmmyyyy_from_ms($ms)
{
    $tz = fnd_wp_tz();
    $sec = intval(((string)$ms)) / 1000;
    if (function_exists('wp_date')) return wp_date('d/m/Y', intval($sec), $tz);
    return date('d/m/Y', intval($sec));
}

function fnd_compute_title_from_meta($post_id)
{
    $ts_ms = get_post_meta($post_id, 'date', true);
    $date_str = $ts_ms ? fnd_format_ddmmyyyy_from_ms($ts_ms) : '';
    $venue = get_post_meta($post_id, 'venue', true);
    if (!$venue) {
        $venue = get_post_meta($post_id, 'ukt_venue', true);
        if (!$venue) {
            $venue = get_post_meta($post_id, 'affiliate_venue', true);
            if (!$venue) {
                $venue = get_post_meta($post_id, 'other_venue', true);
            }
        }
    }
    $show = get_post_meta($post_id, 'title_of_show', true);
    $producer = get_post_meta($post_id, 'producer', true);
    $press = get_post_meta($post_id, 'press_contact', true);

    $parts = array_filter([$date_str, $venue, $show, $producer, $press], function ($v) {
        return (string)$v !== '';
    });
    $title = implode(' - ', $parts);
    if ($title === '') $title = 'Booking';
    return $title;
}

function fnd_get_booking_meta_snapshot($post_id)
{
    $keys = [
        'date',
        'date_ms',
        'day',
        'p',
        'venue',
        'ukt_venue',
        'affiliate_venue',
        'other_venue',
        'venue_is_tba',
        'solt_member_non_solt_venue',
        'title_of_show',
        'show_title_is_tba',
        'producer',
        'press_contact',
        'date_bkd',
        'is_season_gala',
        'is_opera_dance',
        'user_id',
        'time_stamp',
        'created_at',
    ];

    $meta = [];
    foreach ($keys as $key) {
        $meta[$key] = get_post_meta($post_id, $key, true);
    }
    return $meta;
}

function fnd_bookings_log_action($action, array $data = [])
{
    if (fnd_should_skip_log()) {
        return;
    }

    $ip = null;
    if (isset($_SERVER['REMOTE_ADDR'])) {
        $validated_ip = filter_var($_SERVER['REMOTE_ADDR'], FILTER_VALIDATE_IP);
        $ip = $validated_ip !== false ? $validated_ip : null;
    }

    $entry = [
        'timestamp' => current_time('mysql', true),
        'action' => $action,
        'user_id' => get_current_user_id(),
        'ip' => $ip,
        'data' => $data,
    ];

    $summary = [];
    $summary[] = 'Action: ' . strtoupper($action);
    if (!empty($data['post_id'])) {
        $summary[] = 'Booking ID: ' . $data['post_id'];
    }
    if (!empty($data['method'])) {
        $summary[] = 'Method: ' . strtoupper((string)$data['method']);
    }
    if (!empty($data['route'])) {
        $summary[] = 'Route: ' . $data['route'];
    }
    if (!empty($ip)) {
        $summary[] = 'IP: ' . $ip;
    }
    $summary[] = 'User ID: ' . (int)$entry['user_id'];
    $summary_text = implode("\n", array_filter($summary));

    $post_title = sprintf('[%s] %s', strtoupper($action), $entry['timestamp']);
    $post_content = $summary_text !== '' ? $summary_text : strtoupper($action);

    $post_id = wp_insert_post([
        'post_type' => 'fnd_log',
        'post_status' => 'publish',
        'post_title' => $post_title,
        'post_content' => $post_content,
    ], true);

    if (is_wp_error($post_id)) {
        return;
    }

    $encoded = wp_json_encode($entry, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($encoded === false) {
        $encoded = json_encode($entry);
    }
    if ($encoded !== false) {
        update_post_meta($post_id, '_fnd_log_entry', $encoded);
    }
}

function fnd_notification_allowed_value($value, array $allowed, $fallback)
{
    $value = sanitize_key((string)$value);
    return in_array($value, $allowed, true) ? $value : $fallback;
}

function fnd_normalize_notification_activity($booking_id, array $data)
{
    $status = fnd_notification_allowed_value(
        $data['status'] ?? '',
        ['sent', 'failed', 'skipped'],
        'skipped'
    );
    $type = fnd_notification_allowed_value(
        $data['type'] ?? '',
        ['clash', 'pencil_confirmed', 'tba_reminder'],
        'clash'
    );

    $recipient = sanitize_email($data['recipient_email'] ?? '');
    $subject = sanitize_text_field($data['subject'] ?? '');
    $provider = sanitize_key($data['provider'] ?? 'brevo');
    $provider_message_id = sanitize_text_field($data['provider_message_id'] ?? '');
    $error_message = sanitize_textarea_field($data['error_message'] ?? '');
    $trigger = sanitize_key($data['trigger'] ?? '');
    $created_at = sanitize_text_field($data['created_at'] ?? gmdate('c'));
    $sent_at = sanitize_text_field($data['sent_at'] ?? ($status === 'sent' ? gmdate('c') : ''));

    return [
        'booking_id' => (string)intval($booking_id),
        'type' => $type,
        'recipient_email' => $recipient,
        'subject' => $subject,
        'status' => $status,
        'provider' => $provider ?: 'brevo',
        'provider_message_id' => $provider_message_id,
        'error_message' => $error_message,
        'trigger' => $trigger,
        'created_at' => $created_at,
        'sent_at' => $sent_at,
    ];
}

function fnd_record_notification_activity($booking_id, array $data)
{
    $booking_id = intval($booking_id);
    $booking = get_post($booking_id);
    if (!$booking || $booking->post_type !== 'fnd_booking') {
        return new WP_Error('invalid_booking', 'Invalid booking ID.', ['status' => 404]);
    }

    $entry = fnd_normalize_notification_activity($booking_id, $data);
    $title = sprintf(
        '[%s] %s to %s',
        strtoupper($entry['status']),
        str_replace('_', ' ', $entry['type']),
        $entry['recipient_email'] ?: 'unknown recipient'
    );

    $post_id = wp_insert_post([
        'post_type' => 'fnd_notification',
        'post_status' => 'publish',
        'post_title' => $title,
        'post_parent' => $booking_id,
    ], true);

    if (is_wp_error($post_id)) {
        return $post_id;
    }

    $meta_map = [
        '_fnd_booking_id' => $entry['booking_id'],
        '_fnd_notification_type' => $entry['type'],
        '_fnd_recipient_email' => $entry['recipient_email'],
        '_fnd_subject' => $entry['subject'],
        '_fnd_status' => $entry['status'],
        '_fnd_provider' => $entry['provider'],
        '_fnd_provider_message_id' => $entry['provider_message_id'],
        '_fnd_error_message' => $entry['error_message'],
        '_fnd_trigger' => $entry['trigger'],
        '_fnd_created_at' => $entry['created_at'],
        '_fnd_sent_at' => $entry['sent_at'],
    ];

    foreach ($meta_map as $key => $value) {
        update_post_meta($post_id, $key, $value);
    }

    return $post_id;
}

function fnd_notification_to_array($post_id)
{
    return [
        'id' => intval($post_id),
        'booking_id' => intval(get_post_meta($post_id, '_fnd_booking_id', true)),
        'type' => get_post_meta($post_id, '_fnd_notification_type', true),
        'recipient_email' => get_post_meta($post_id, '_fnd_recipient_email', true),
        'subject' => get_post_meta($post_id, '_fnd_subject', true),
        'status' => get_post_meta($post_id, '_fnd_status', true),
        'provider' => get_post_meta($post_id, '_fnd_provider', true),
        'provider_message_id' => get_post_meta($post_id, '_fnd_provider_message_id', true),
        'error_message' => get_post_meta($post_id, '_fnd_error_message', true),
        'trigger' => get_post_meta($post_id, '_fnd_trigger', true),
        'created_at' => get_post_meta($post_id, '_fnd_created_at', true),
        'sent_at' => get_post_meta($post_id, '_fnd_sent_at', true),
    ];
}

function fnd_get_booking_notifications($booking_id, $limit = 20)
{
    $posts = get_posts([
        'post_type' => 'fnd_notification',
        'post_status' => 'publish',
        'post_parent' => intval($booking_id),
        'posts_per_page' => max(1, min(100, intval($limit))),
        'orderby' => 'date',
        'order' => 'DESC',
    ]);

    return array_map(function ($post) {
        return fnd_notification_to_array($post->ID);
    }, $posts);
}

function fnd_render_log_entry_metabox($post)
{
    $raw = get_post_meta($post->ID, '_fnd_log_entry', true);
    if (!$raw) {
        echo '<p>No log payload stored for this entry.</p>';
        return;
    }

    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        $display = wp_json_encode($decoded, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        if ($display === false) {
            $display = $raw;
        }
    } else {
        $display = $raw;
    }

    echo '<textarea readonly style="width:100%;min-height:300px;font-family:monospace;">' . esc_textarea($display) . '</textarea>';
}

function fnd_format_notification_time($value)
{
    if (!$value) return '';
    $timestamp = strtotime((string)$value);
    if (!$timestamp) return (string)$value;
    $tz = fnd_wp_tz();
    return function_exists('wp_date') ? wp_date('d/m/Y H:i', $timestamp, $tz) : date('d/m/Y H:i', $timestamp);
}

function fnd_render_booking_notifications_metabox($post)
{
    $notifications = fnd_get_booking_notifications($post->ID, 20);
    if (empty($notifications)) {
        echo '<p>No notification activity recorded for this booking.</p>';
        return;
    }

    echo '<div style="display:flex;flex-direction:column;gap:12px;">';
    foreach ($notifications as $item) {
        $status = (string)($item['status'] ?? 'skipped');
        $color = $status === 'sent' ? '#15803d' : ($status === 'failed' ? '#b91c1c' : '#92400e');
        $type = ucwords(str_replace('_', ' ', (string)($item['type'] ?? 'notification')));
        $time = fnd_format_notification_time($item['sent_at'] ?: $item['created_at']);

        echo '<div style="border:1px solid #dcdcde;border-radius:4px;padding:10px;background:#fff;">';
        echo '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">';
        echo '<strong>' . esc_html($type) . '</strong>';
        echo '<span style="color:#fff;background:' . esc_attr($color) . ';border-radius:10px;padding:2px 7px;font-size:11px;text-transform:uppercase;">' . esc_html($status) . '</span>';
        echo '</div>';
        echo '<div style="font-size:12px;line-height:1.5;">';
        if (!empty($item['recipient_email'])) echo '<div><strong>To:</strong> ' . esc_html($item['recipient_email']) . '</div>';
        if (!empty($time)) echo '<div><strong>When:</strong> ' . esc_html($time) . '</div>';
        if (!empty($item['trigger'])) echo '<div><strong>Trigger:</strong> ' . esc_html(str_replace('_', ' ', $item['trigger'])) . '</div>';
        if (!empty($item['provider_message_id'])) echo '<div><strong>Brevo ID:</strong> ' . esc_html($item['provider_message_id']) . '</div>';
        if (!empty($item['error_message'])) echo '<div style="margin-top:6px;color:#b91c1c;"><strong>Error:</strong> ' . esc_html($item['error_message']) . '</div>';
        echo '</div>';
        echo '</div>';
    }
    echo '</div>';
}

add_action('add_meta_boxes', function () {
    add_meta_box(
        'fnd_log_entry_payload',
        'Log Payload',
        'fnd_render_log_entry_metabox',
        'fnd_log',
        'normal',
        'default'
    );

    add_meta_box(
        'fnd_booking_notifications',
        'Notifications',
        'fnd_render_booking_notifications_metabox',
        'fnd_booking',
        'side',
        'default'
    );
});

function fnd_date_str_from_ms($ms)
{
    $tz = fnd_wp_tz();
    $sec = (int) floor(((int)$ms) / 1000);
    return function_exists('wp_date') ? wp_date('Y-m-d', $sec, $tz) : date('Y-m-d', $sec);
}

function fnd_ms_to_mysql_datetime($ms, $tz = null)
{
    $sec = (int) floor(((int)$ms) / 1000);
    $tz = $tz ?: fnd_wp_tz();
    if (function_exists('wp_date')) {
        return wp_date('Y-m-d H:i:s', $sec, $tz);
    }
    $dt = new DateTime('@' . $sec);
    $dt->setTimezone($tz);
    return $dt->format('Y-m-d H:i:s');
}

function fnd_ms_to_mysql_gmt($ms)
{
    $sec = (int) floor(((int)$ms) / 1000);
    if (function_exists('wp_date')) {
        return wp_date('Y-m-d H:i:s', $sec, new DateTimeZone('UTC'));
    }
    return gmdate('Y-m-d H:i:s', $sec);
}

function fnd_create_booking_from_payload(array $p, array $opts = [])
{
    $now = time() * 1000;
    $tz = fnd_wp_tz();
    $raw_title = isset($p['title_of_show']) ? sanitize_text_field($p['title_of_show']) : '';
    if ($raw_title === '') $raw_title = 'TBC';

    $created_ms = isset($p['created_at']) && $p['created_at'] !== ''
        ? intval($p['created_at'])
        : (isset($p['time_stamp']) && $p['time_stamp'] !== '' ? intval($p['time_stamp']) : $now);
    $updated_ms = isset($p['time_stamp']) && $p['time_stamp'] !== ''
        ? intval($p['time_stamp'])
        : $created_ms;

    $post_args = [
        'post_type' => 'fnd_booking',
        'post_status' => 'publish',
        // Keep title as show title or TBC
        'post_title' => $raw_title,
    ];

    if (!empty($opts['preserve_timestamps'])) {
        $post_args['post_date'] = fnd_ms_to_mysql_datetime($created_ms, $tz);
        $post_args['post_date_gmt'] = fnd_ms_to_mysql_gmt($created_ms);
        $post_args['post_modified'] = fnd_ms_to_mysql_datetime($updated_ms, $tz);
        $post_args['post_modified_gmt'] = fnd_ms_to_mysql_gmt($updated_ms);
    }

    $prev_preserve = fnd_should_preserve_timestamps();
    if (!empty($opts['preserve_timestamps'])) {
        $GLOBALS['fnd_preserve_timestamps'] = true;
    }

    $post_id = wp_insert_post($post_args, true);
    if (is_wp_error($post_id)) {
        if ($prev_preserve) {
            $GLOBALS['fnd_preserve_timestamps'] = true;
        } else {
            unset($GLOBALS['fnd_preserve_timestamps']);
        }
        return $post_id;
    }

    $incoming = isset($p['date']) ? $p['date'] : (isset($p['date_ms']) ? $p['date_ms'] : $now);
    $normalized_ms = fnd_normalize_ms_to_site_midnight($incoming);
    $date_str = fnd_date_str_from_ms($normalized_ms);
    $meta = [
        // Store human/ACF field as Y-m-d and numeric as ms
        'date' => $date_str,
        'date_ms' => (string) $normalized_ms,
        // Compute day from timestamp using site timezone to avoid client tz drift
        'day'  => function () use ($normalized_ms, $tz) {
            $ts = $normalized_ms;
            if (function_exists('wp_date')) return wp_date('l', intval($ts / 1000), $tz);
            return date('l', intval($ts / 1000));
        },
        'p'    => (string) fnd_bool_int($p['p'] ?? 0),
        'venue' => sanitize_text_field($p['venue'] ?? ''),
        'ukt_venue' => sanitize_text_field($p['ukt_venue'] ?? ''),
        'affiliate_venue' => sanitize_text_field($p['affiliate_venue'] ?? ''),
        'other_venue' => sanitize_text_field($p['other_venue'] ?? ''),
        'venue_is_tba' => (string) fnd_bool_int($p['venue_is_tba'] ?? 0),
        'solt_member_non_solt_venue' => (string) fnd_bool_int($p['solt_member_non_solt_venue'] ?? 0),
        'title_of_show' => sanitize_text_field($p['title_of_show'] ?? ''),
        'show_title_is_tba' => (string) fnd_bool_int($p['show_title_is_tba'] ?? 0),
        'producer' => sanitize_text_field($p['producer'] ?? ''),
        'press_contact' => sanitize_email($p['press_contact'] ?? ''),
        'date_bkd' => sanitize_text_field($p['date_bkd'] ?? ''),
        'is_season_gala' => (string) fnd_bool_int($p['is_season_gala'] ?? 0),
        'is_opera_dance' => (string) fnd_bool_int($p['is_opera_dance'] ?? 0),
        'user_id' => sanitize_text_field($p['user_id'] ?? ''),
        'time_stamp' => (string) $updated_ms,
        'created_at' => (string) $created_ms,
    ];
    foreach ($meta as $k => $v) {
        // Evaluate closures (for 'day')
        if ($v instanceof Closure) {
            $v = $v();
            $meta[$k] = $v;
        }
        update_post_meta($post_id, $k, $v);
    }

    if (empty($opts['skip_log'])) {
        $context = isset($opts['log_context']) && is_array($opts['log_context']) ? $opts['log_context'] : [];
        $context['post_id'] = $post_id;
        $context['request'] = $p;
        $context['stored_meta'] = fnd_get_booking_meta_snapshot($post_id);
        fnd_bookings_log_action('create', $context);
    }

    if ($prev_preserve) {
        $GLOBALS['fnd_preserve_timestamps'] = true;
    } else {
        unset($GLOBALS['fnd_preserve_timestamps']);
    }

    return $post_id;
}

add_action('rest_api_init', function () {
    register_rest_route('fnd/v1', '/bookings', [
        [
            'methods' => 'POST',
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
            'callback' => function (WP_REST_Request $req) {
                $p = $req->get_json_params();
                $preserve = array_key_exists('created_at', $p) || array_key_exists('time_stamp', $p);
                $post_id = fnd_create_booking_from_payload($p, [
                    'preserve_timestamps' => $preserve,
                    'log_context' => [
                        'route' => $req->get_route(),
                        'method' => $req->get_method(),
                    ],
                ]);
                if (is_wp_error($post_id)) return $post_id;
                return new WP_REST_Response(['id' => $post_id], 201);
            }
        ],
    ]);

    // Update and delete (id)
    register_rest_route('fnd/v1', '/bookings/(?P<id>\d+)', [
        [
            // Allow PATCH and POST (POST is useful on hosts blocking PATCH)
            'methods' => ['PATCH', 'POST'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
            'callback' => function (WP_REST_Request $req) {
                $id = intval($req['id']);
                if (!get_post($id)) return new WP_Error('not_found', 'Not found', ['status' => 404]);
                $p = $req->get_json_params();
                $prev_skip = !empty($GLOBALS['fnd_skip_clash_webhook']);
                $GLOBALS['fnd_skip_clash_webhook'] = true;
                $preserve_timestamps = array_key_exists('created_at', $p) || array_key_exists('time_stamp', $p);
                $prev_preserve = fnd_should_preserve_timestamps();
                if ($preserve_timestamps) {
                    $GLOBALS['fnd_preserve_timestamps'] = true;
                }

                try {
                    $updates = [];
                    $updatedDate = null;
                    foreach ($p as $k => $v) {
                        if ($k === 'p' || $k === 'venue_is_tba' || $k === 'solt_member_non_solt_venue' || $k === 'show_title_is_tba' || $k === 'is_season_gala' || $k === 'is_opera_dance') {
                            $value = (string) fnd_bool_int($v);
                            update_post_meta($id, $k, $value);
                            $updates[$k] = $value;
                        } elseif ($k === 'press_contact') {
                            $value = sanitize_email($v);
                            update_post_meta($id, $k, $value);
                            $updates[$k] = $value;
                        } elseif ($k === 'date' || $k === 'date_ms' || $k === 'time_stamp' || $k === 'created_at') {
                            if ($k === 'date' || $k === 'date_ms') {
                                $ms = fnd_normalize_ms_to_site_midnight($v);
                                update_post_meta($id, 'date_ms', (string)$ms);
                                $date_str = fnd_date_str_from_ms($ms);
                                update_post_meta($id, 'date', $date_str);
                                $updatedDate = (int)$ms;
                                $updates['date_ms'] = (string)$ms;
                                $updates['date'] = $date_str;
                            } else {
                                $value = (string) intval($v);
                                update_post_meta($id, $k, $value);
                                $updates[$k] = $value;
                            }
                        } else {
                            $value = sanitize_text_field($v);
                            update_post_meta($id, $k, $value);
                            $updates[$k] = $value;
                        }
                    }
                    // If date changed, recompute 'day' in site timezone
                    if (!is_null($updatedDate)) {
                        $tz = fnd_wp_tz();
                        $day = function_exists('wp_date') ? wp_date('l', intval($updatedDate / 1000), $tz) : date('l', intval($updatedDate / 1000));
                        update_post_meta($id, 'day', $day);
                        $updates['day'] = $day;
                    }
                    // If title_of_show changed, sync post_title to show title or TBC
                    if (array_key_exists('title_of_show', $p)) {
                        $t = trim((string) get_post_meta($id, 'title_of_show', true));
                        if ($t === '') $t = 'TBC';
                        $sanitized_title = sanitize_text_field($t);
                        wp_update_post(['ID' => $id, 'post_title' => $sanitized_title]);
                        $updates['post_title'] = $sanitized_title;
                    }
                    fnd_bookings_log_action('update', [
                        'route' => $req->get_route(),
                        'method' => $req->get_method(),
                        'post_id' => $id,
                        'request' => $p,
                        'updates' => $updates,
                        'stored_meta' => fnd_get_booking_meta_snapshot($id),
                    ]);
                    return ['id' => $id];
                } finally {
                    $GLOBALS['fnd_skip_clash_webhook'] = $prev_skip;
                    if ($prev_preserve) {
                        $GLOBALS['fnd_preserve_timestamps'] = true;
                    } else {
                        unset($GLOBALS['fnd_preserve_timestamps']);
                    }
                }
            }
        ],
        [
            'methods' => 'DELETE',
            'permission_callback' => function () {
                return current_user_can('delete_posts');
            },
            'callback' => function (WP_REST_Request $req) {
                $id = intval($req['id']);
                $post = get_post($id);
                if (!$post) return new WP_Error('not_found', 'Not found', ['status' => 404]);
                $snapshot = fnd_get_booking_meta_snapshot($id);
                fnd_bookings_log_action('delete', [
                    'route' => $req->get_route(),
                    'method' => $req->get_method(),
                    'post_id' => $id,
                    'request' => $req->get_params(),
                    'post' => [
                        'post_title' => $post->post_title,
                        'post_status' => $post->post_status,
                    ],
                    'stored_meta' => $snapshot,
                ]);
                wp_trash_post($id);
                return new WP_REST_Response(null, 204);
            }
        ],
    ]);

    // POST-friendly delete endpoint for environments that block DELETE
    register_rest_route('fnd/v1', '/bookings/(?P<id>\d+)/delete', [
        [
            'methods' => 'POST',
            'permission_callback' => function () {
                return current_user_can('delete_posts');
            },
            'callback' => function (WP_REST_Request $req) {
                $id = intval($req['id']);
                $post = get_post($id);
                if (!$post) return new WP_Error('not_found', 'Not found', ['status' => 404]);
                $snapshot = fnd_get_booking_meta_snapshot($id);
                fnd_bookings_log_action('delete', [
                    'route' => $req->get_route(),
                    'method' => $req->get_method(),
                    'post_id' => $id,
                    'request' => $req->get_params(),
                    'post' => [
                        'post_title' => $post->post_title,
                        'post_status' => $post->post_status,
                    ],
                    'stored_meta' => $snapshot,
                ]);
                wp_trash_post($id);
                return new WP_REST_Response(null, 204);
            }
        ],
    ]);

    register_rest_route('fnd/v1', '/bookings/(?P<id>\d+)/notifications', [
        [
            'methods' => 'GET',
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
            'callback' => function (WP_REST_Request $req) {
                $id = intval($req['id']);
                $post = get_post($id);
                if (!$post || $post->post_type !== 'fnd_booking') {
                    return new WP_Error('not_found', 'Not found', ['status' => 404]);
                }

                $limit = intval($req->get_param('limit') ?: 20);
                return [
                    'booking_id' => $id,
                    'notifications' => fnd_get_booking_notifications($id, $limit),
                ];
            }
        ],
        [
            'methods' => 'POST',
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
            'callback' => function (WP_REST_Request $req) {
                $id = intval($req['id']);
                $params = $req->get_json_params();
                if (!is_array($params)) {
                    $params = [];
                }

                $notification_id = fnd_record_notification_activity($id, $params);
                if (is_wp_error($notification_id)) {
                    return $notification_id;
                }

                return new WP_REST_Response([
                    'id' => intval($notification_id),
                    'notification' => fnd_notification_to_array($notification_id),
                ], 201);
            }
        ],
    ]);

    register_rest_route('fnd/v1', '/bookings/year/(?P<year>\d+)', [
        [
            'methods' => 'GET',
            'permission_callback' => '__return_true',
            'callback' => function (WP_REST_Request $req) {
                $year = intval($req['year']);
                // Use site timezone to build year boundaries (ms)
                $tz = fnd_wp_tz();
                $start_dt = new DateTimeImmutable("{$year}-01-01 00:00:00", $tz);
                $end_dt   = new DateTimeImmutable("{$year}-12-31 23:59:59", $tz);
                $start = $start_dt->getTimestamp() * 1000;
                $end   = $end_dt->getTimestamp() * 1000;

                $q = new WP_Query([
                    'post_type' => 'fnd_booking',
                    'post_status' => 'publish',
                    'posts_per_page' => -1,
                    'meta_query' => [[
                        'key' => 'date_ms',
                        'value' => [$start, $end],
                        'type' => 'NUMERIC',
                        'compare' => 'BETWEEN',
                    ]],
                    'orderby' => 'meta_value_num',
                    'meta_key' => 'date_ms',
                    'order' => 'ASC',
                ]);

                $Dates = [];
                while ($q->have_posts()) {
                    $q->the_post();
                    $id = get_the_ID();
                    $meta = [];
                    foreach (['date', 'date_ms', 'day', 'p', 'venue', 'ukt_venue', 'affiliate_venue', 'other_venue', 'venue_is_tba', 'solt_member_non_solt_venue', 'title_of_show', 'show_title_is_tba', 'producer', 'press_contact', 'date_bkd', 'is_season_gala', 'is_opera_dance', 'user_id', 'time_stamp', 'created_at'] as $k) {
                        $meta[$k] = get_post_meta($id, $k, true);
                    }
                    // Prefer date_ms; fallback to date string
                    $ts = $meta['date_ms'] !== '' ? intval($meta['date_ms']) : intval(fnd_normalize_ms_to_site_midnight($meta['date']));
                    // Format date in site timezone (e.g., Europe/London)
                    if (function_exists('wp_date')) {
                        $ddmmyyyy = wp_date('d/m/Y', intval($ts / 1000), $tz);
                    } else {
                        $ddmmyyyy = date('d/m/Y', intval($ts / 1000));
                    }
                    $row = [
                        'id' => $id,
                        'date' => $ts,
                        'day' => $meta['day'],
                        'p' => intval($meta['p']),
                        'venue' => $meta['venue'],
                        'uktVenue' => $meta['ukt_venue'],
                        'affiliateVenue' => $meta['affiliate_venue'],
                        'otherVenue' => $meta['other_venue'],
                        'venueIsTba' => intval($meta['venue_is_tba']),
                        'soltMemberNonSoltVenue' => intval($meta['solt_member_non_solt_venue']),
                        'titleOfShow' => $meta['title_of_show'],
                        'showTitleIsTba' => intval($meta['show_title_is_tba']),
                        'producer' => $meta['producer'],
                        'pressContact' => $meta['press_contact'],
                        'dateBkd' => $meta['date_bkd'],
                        'isSeasonGala' => intval($meta['is_season_gala']),
                        'isOperaDance' => intval($meta['is_opera_dance']),
                        'userId' => $meta['user_id'],
                        'timeStamp' => intval($meta['time_stamp']),
                        'createdAt' => intval($meta['created_at']),
                        'Date' => $ddmmyyyy,
                        'range' => $id,
                    ];

                    $venue_sources = [
                        'SOLT Venue' => is_string($meta['venue']) ? trim($meta['venue']) : '',
                        'UK Theatre Venue' => is_string($meta['ukt_venue']) ? trim($meta['ukt_venue']) : '',
                        'Affiliate Venue' => is_string($meta['affiliate_venue']) ? trim($meta['affiliate_venue']) : '',
                        'Other' => is_string($meta['other_venue']) ? trim($meta['other_venue']) : '',
                    ];

                    $is_solt_member_non_solt = intval($meta['solt_member_non_solt_venue']) === 1;
                    $combinedVenue = '';
                    $membershipLabel = '';

                    if ($is_solt_member_non_solt) {
                        // Prefer other/affiliate/UKT/venue for display; label reflects SOLT member flag
                        foreach (['Other', 'Affiliate Venue', 'UK Theatre Venue', 'SOLT Venue'] as $label) {
                            if ($venue_sources[$label] !== '') {
                                $combinedVenue = $venue_sources[$label];
                                break;
                            }
                        }
                        $membershipLabel = 'SOLT Member (non-SOLT venue)';
                    } else {
                        foreach ($venue_sources as $label => $value) {
                            if ($value !== '') {
                                $combinedVenue = $value;
                                $membershipLabel = $label;
                                break;
                            }
                        }
                    }

                    if ($combinedVenue === '' && intval($meta['venue_is_tba']) === 1) {
                        $combinedVenue = 'TBA';
                    }

                    $row['combinedVenue'] = $combinedVenue;
                    $row['membership'] = $membershipLabel;

                    if (!isset($Dates[$ddmmyyyy])) $Dates[$ddmmyyyy] = [];
                    $Dates[$ddmmyyyy][$id] = $row;
                }
                wp_reset_postdata();

                return [
                    'Year' => (string)$year,
                    'Range' => '',
                    'Dates' => $Dates,
                ];
            }
        ]
    ]);

    register_rest_route('fnd/v1', '/bookings/date', [
        [
            'methods' => 'GET',
            'permission_callback' => '__return_true',
            'callback' => function (WP_REST_Request $req) {
                $ts = intval($req->get_param('ts'));
                $start = $ts;
                $end = $ts;
                $q = new WP_Query([
                    'post_type' => 'fnd_booking',
                    'post_status' => 'publish',
                    'posts_per_page' => -1,
                    'meta_query' => [[
                        'key' => 'date_ms',
                        'value' => [$start, $end],
                        'type' => 'NUMERIC',
                        'compare' => 'BETWEEN',
                    ]]
                ]);
                $rows = [];
                while ($q->have_posts()) {
                    $q->the_post();
                    $rows[] = get_the_ID();
                }
                wp_reset_postdata();
                return $rows;
            }
        ]
    ]);

    // Debug route to inspect how 'date' is being parsed and mirrored
    register_rest_route('fnd/v1', '/debug/date', [
        [
            'methods' => 'GET',
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
            'callback' => function (WP_REST_Request $req) {
                $id = intval($req->get_param('id'));
                if (!$id || !get_post($id)) return new WP_Error('not_found', 'Invalid id', ['status' => 404]);
                $raw = get_post_meta($id, 'date', true);
                $raw_ms = get_post_meta($id, 'date_ms', true);
                $norm_ms = fnd_normalize_ms_to_site_midnight($raw !== '' ? $raw : $raw_ms);
                $tz = fnd_wp_tz();
                $fmt = function_exists('wp_date') ? wp_date('d/m/Y H:i:s', intval($norm_ms / 1000), $tz) : date('d/m/Y H:i:s', intval($norm_ms / 1000));
                return [
                    'id' => $id,
                    'site_tz' => (function_exists('wp_timezone_string') ? wp_timezone_string() : get_option('timezone_string')) ?: 'UTC',
                    'date_meta' => $raw,
                    'date_ms_meta' => $raw_ms,
                    'normalized_ms' => $norm_ms,
                    'normalized_human' => $fmt,
                    'types' => ['date' => gettype($raw), 'date_ms' => gettype($raw_ms)],
                ];
            }
        ]
    ]);
});

function fnd_import_normalize_key($value)
{
    $value = (string) $value;
    $value = preg_replace('/^\xEF\xBB\xBF/', '', $value);
    $value = strtolower($value);
    return preg_replace('/[^a-z0-9]+/', '', $value);
}

function fnd_tba_reminder_window_ms($days_ahead = 30)
{
    $tz = fnd_wp_tz();
    $start = new DateTimeImmutable('today +' . intval($days_ahead) . ' days', $tz);
    $end = $start->setTime(23, 59, 59);
    return [
        intval($start->getTimestamp() * 1000),
        intval($end->getTimestamp() * 1000),
    ];
}

function fnd_tba_future_window_ms($days_from_today = 0)
{
    $tz = fnd_wp_tz();
    $start = new DateTimeImmutable('today +' . intval($days_from_today) . ' days', $tz);
    $end = $start->modify('+10 years')->setTime(23, 59, 59);
    return [
        intval($start->getTimestamp() * 1000),
        intval($end->getTimestamp() * 1000),
    ];
}

function fnd_tba_collect_bookings_for_window($start_ms, $end_ms)
{
    $q = new WP_Query([
        'post_type' => 'fnd_booking',
        'posts_per_page' => -1,
        'fields' => 'ids',
        'meta_query' => [
            'relation' => 'AND',
            [
                'key' => 'date_ms',
                'value' => [$start_ms, $end_ms],
                'compare' => 'BETWEEN',
                'type' => 'NUMERIC',
            ],
            [
                'relation' => 'OR',
                [
                    'key' => 'show_title_is_tba',
                    'value' => '1',
                    'compare' => '=',
                ],
                [
                    'key' => 'venue_is_tba',
                    'value' => '1',
                    'compare' => '=',
                ],
            ],
        ],
    ]);
    if (empty($q->posts)) {
        return [];
    }

    $out = [];
    foreach ($q->posts as $post_id) {
        $email = get_post_meta($post_id, 'press_contact', true);
        if (!$email || !is_email($email)) continue;
        $title = get_post_meta($post_id, 'title_of_show', true);
        $venue = get_post_meta($post_id, 'venue', true);
        $other_venue = get_post_meta($post_id, 'other_venue', true);
        $affiliate = get_post_meta($post_id, 'affiliate_venue', true);
        $date_str = get_post_meta($post_id, 'date', true);
        $date_ms = get_post_meta($post_id, 'date_ms', true);
        $display_date = $date_str ?: fnd_date_str_from_ms($date_ms);
        $needs_title = fnd_bool_int(get_post_meta($post_id, 'show_title_is_tba', true)) === 1;
        $needs_venue = fnd_bool_int(get_post_meta($post_id, 'venue_is_tba', true)) === 1;

        $out[$email][] = [
            'date' => $display_date ?: '(no date)',
            'title' => $title ?: 'TBA',
            'venue' => $venue ?: ($other_venue ?: $affiliate ?: 'TBA'),
            'needsTitle' => $needs_title,
            'needsVenue' => $needs_venue,
        ];
    }
    return $out;
}

function fnd_tba_send_reminders()
{
    $enabled = fnd_tba_reminders_enabled();

    if ($enabled) {
        [$start_ms, $end_ms] = fnd_tba_reminder_window_ms(30);
    } else {
        [$start_ms, $end_ms] = fnd_tba_future_window_ms(0);
    }
    $by_email = fnd_tba_collect_bookings_for_window($start_ms, $end_ms);
    if (empty($by_email)) return;

    foreach ($by_email as $email => $items) {
        if (!$enabled && strcasecmp($email, 'john@lawrencedavis.co.uk') !== 0) {
            continue;
        }
        foreach ($items as $item) {
            // send one email per booking for this press contact
            fnd_send_tba_webhook($email, [$item]);
        }
    }
}

add_action('init', function () {
    if (!wp_next_scheduled('fnd_tba_reminder_daily')) {
        wp_schedule_event(time() + HOUR_IN_SECONDS, 'daily', 'fnd_tba_reminder_daily');
    }
});
add_action('fnd_tba_reminder_daily', 'fnd_tba_send_reminders');

function fnd_import_ascii_clean($value)
{
    if ($value === null) return '';
    $s = (string) $value;
    $s = str_replace(
        ["\xE2\x80\x98", "\xE2\x80\x99", "\xE2\x80\xB2", "\xE2\x80\x9C", "\xE2\x80\x9D", "\xE2\x80\xB3", "\xE2\x80\x93", "\xE2\x80\x94"],
        ["'", "'", "'", '"', '"', '"', '-', '-'],
        $s
    );
    $s = preg_replace('/\x{00A0}/u', ' ', $s);
    $s = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]/u', '', $s);
    if (function_exists('iconv')) {
        $converted = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
        if ($converted !== false) {
            $s = $converted;
        }
    }
    $s = preg_replace('/\s+/', ' ', $s);
    return trim($s);
}

function fnd_import_map_header_to_key($header)
{
    $key = fnd_import_normalize_key($header);
    $map = [
        'date' => 'date',
        'day' => 'day',
        'titleofshow' => 'title_of_show',
        'showtitle' => 'title_of_show',
        'showtitleoftheproduction' => 'title_of_show',
        'venue' => 'venue',
        'ukvenue' => 'ukt_venue',
        'uktvenue' => 'ukt_venue',
        'affiliatevenue' => 'affiliate_venue',
        'othervenue' => 'other_venue',
        'p' => 'p',
        'pencilled' => 'p',
        'penciled' => 'p',
        'venueistba' => 'venue_is_tba',
        'showtitleistba' => 'show_title_is_tba',
        'isseasongala' => 'is_season_gala',
        'seasongala' => 'is_season_gala',
        'isoperadance' => 'is_opera_dance',
        'operadance' => 'is_opera_dance',
        'producer' => 'producer',
        'presscontact' => 'press_contact',
        'email' => 'press_contact',
        'datebkd' => 'date_bkd',
        'datebooked' => 'date_bkd',
        'userid' => 'user_id',
        'timestamp' => 'time_stamp',
        'updatedat' => 'time_stamp',
        'createdat' => 'created_at',
    ];
    return $map[$key] ?? null;
}

function fnd_import_to_boolean($value)
{
    if ($value === null || $value === '') return 0;
    if (is_bool($value)) return $value ? 1 : 0;
    if (is_numeric($value)) return intval($value) ? 1 : 0;
    $s = strtolower(trim((string) $value));
    return in_array($s, ['1', 'y', 'yes', 'true'], true) ? 1 : 0;
}

function fnd_import_to_timestamp($value)
{
    if ($value === null || $value === '') return null;
    $build_ts = function ($year, $month, $day, $hour = 0, $minute = 0, $second = 0) {
        if (!checkdate($month, $day, $year)) return null;
        try {
            $dt = new DateTimeImmutable(
                sprintf('%04d-%02d-%02d %02d:%02d:%02d', $year, $month, $day, $hour, $minute, $second),
                fnd_wp_tz()
            );
        } catch (Exception $e) {
            return null;
        }
        return $dt->getTimestamp() * 1000;
    };

    if (is_numeric($value)) {
        $num_str = trim((string) $value);
        if (preg_match('/^\d{8}$/', $num_str)) {
            $year = (int) substr($num_str, 0, 4);
            $month = (int) substr($num_str, 4, 2);
            $day = (int) substr($num_str, 6, 2);
            $ts = $build_ts($year, $month, $day);
            if ($ts !== null) return $ts;
        }
        $num = (float) $value;
        if ($num < 10000000) {
            $excel_epoch = gmmktime(0, 0, 0, 1, 1, 1900) * 1000;
            $days = floor($num);
            return (int) ($excel_epoch + ($days - 2) * 86400 * 1000);
        }
        if ($num < 1e12) {
            return (int) round($num * 1000);
        }
        return (int) round($num);
    }
    $s = trim((string) $value);
    if ($s === '') return null;

    if (preg_match('/^(\d{4})[\/-](\d{2})[\/-](\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/', $s, $m)) {
        $year = (int) $m[1];
        $a = (int) $m[2];
        $b = (int) $m[3];
        $hour = isset($m[4]) ? (int) $m[4] : 0;
        $minute = isset($m[5]) ? (int) $m[5] : 0;
        $second = isset($m[6]) ? (int) $m[6] : 0;
        $month = $a;
        $day = $b;
        if ($a > 12 && $b <= 12) {
            $month = $b;
            $day = $a;
        }
        $ts = $build_ts($year, $month, $day, $hour, $minute, $second);
        if ($ts !== null) return $ts;
        if ($a <= 12 && $b <= 12) {
            $ts = $build_ts($year, $b, $a, $hour, $minute, $second);
            if ($ts !== null) return $ts;
        }
        return null;
    }

    if (preg_match('/^(\d{2})[\/-](\d{2})[\/-](\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/', $s, $m)) {
        $a = (int) $m[1];
        $b = (int) $m[2];
        $year = (int) $m[3];
        $hour = isset($m[4]) ? (int) $m[4] : 0;
        $minute = isset($m[5]) ? (int) $m[5] : 0;
        $second = isset($m[6]) ? (int) $m[6] : 0;
        $month = $b;
        $day = $a;
        if ($a <= 12 && $b > 12) {
            $month = $a;
            $day = $b;
        } elseif ($a > 12 && $b <= 12) {
            $month = $b;
            $day = $a;
        }
        $ts = $build_ts($year, $month, $day, $hour, $minute, $second);
        if ($ts !== null) return $ts;
        $ts = $build_ts($year, $day, $month, $hour, $minute, $second);
        if ($ts !== null) return $ts;
        return null;
    }

    $ts = strtotime($s);
    if ($ts === false) return null;
    return $ts * 1000;
}

function fnd_import_coerce_row(array $row, array $header_map)
{
    $out = [];
    foreach ($header_map as $index => $key) {
        if ($key === null) continue;
        $out[$key] = isset($row[$index]) ? $row[$index] : '';
    }

    $date_ts = fnd_import_to_timestamp($out['date'] ?? null);
    if (!$date_ts) return null;

    $day = $out['day'] ?? '';
    if ($day === '' || $day === null) {
        $day = function_exists('wp_date')
            ? wp_date('l', intval($date_ts / 1000), fnd_wp_tz())
            : date('l', intval($date_ts / 1000));
    }

    $venue = isset($out['venue']) ? fnd_import_ascii_clean($out['venue']) : '';
    $title = isset($out['title_of_show']) ? fnd_import_ascii_clean($out['title_of_show']) : '';
    $time_stamp = fnd_import_to_timestamp($out['time_stamp'] ?? null);
    $created_at = fnd_import_to_timestamp($out['created_at'] ?? null);
    $date_bkd_ts = fnd_import_to_timestamp($out['date_bkd'] ?? null);
    if ($created_at === null) {
        if ($date_bkd_ts !== null) {
            $created_at = $date_bkd_ts;
        } elseif ($time_stamp !== null) {
            $created_at = $time_stamp;
        }
    }

    $payload = [
        'date' => $date_ts,
        'day' => $day,
        'p' => fnd_import_to_boolean($out['p'] ?? null),
        'venue' => $venue,
        'ukt_venue' => isset($out['ukt_venue']) ? fnd_import_ascii_clean($out['ukt_venue']) : '',
        'affiliate_venue' => isset($out['affiliate_venue']) ? fnd_import_ascii_clean($out['affiliate_venue']) : '',
        'other_venue' => isset($out['other_venue']) ? fnd_import_ascii_clean($out['other_venue']) : '',
        'venue_is_tba' => fnd_import_to_boolean($out['venue_is_tba'] ?? null),
        'solt_member_non_solt_venue' => fnd_import_to_boolean($out['solt_member_non_solt_venue'] ?? null),
        'title_of_show' => $title,
        'show_title_is_tba' => fnd_import_to_boolean($out['show_title_is_tba'] ?? null),
        'producer' => isset($out['producer']) ? fnd_import_ascii_clean($out['producer']) : '',
        'press_contact' => isset($out['press_contact']) ? fnd_import_ascii_clean($out['press_contact']) : '',
        'date_bkd' => isset($out['date_bkd']) ? (string) $out['date_bkd'] : '',
        'is_season_gala' => fnd_import_to_boolean($out['is_season_gala'] ?? null),
        'is_opera_dance' => fnd_import_to_boolean($out['is_opera_dance'] ?? null),
        'user_id' => isset($out['user_id']) ? (string) $out['user_id'] : '',
    ];

    if ($time_stamp !== null) $payload['time_stamp'] = $time_stamp;
    if ($created_at !== null) $payload['created_at'] = $created_at;

    return $payload;
}

function fnd_import_build_header_map(array $headers)
{
    $header_map = [];
    $has_date = false;
    foreach ($headers as $index => $header) {
        $key = fnd_import_map_header_to_key($header);
        if ($key === 'date') $has_date = true;
        $header_map[$index] = $key;
    }
    return [$header_map, $has_date];
}

function fnd_import_get_row_value(array $row, array $header_map, $key)
{
    foreach ($header_map as $index => $mapped_key) {
        if ($mapped_key === $key) {
            return array_key_exists($index, $row) ? $row[$index] : null;
        }
    }
    return null;
}

function fnd_import_is_blank_row(array $row)
{
    if (empty($row)) return true;
    foreach ($row as $cell) {
        if ($cell !== null && trim((string) $cell) !== '') {
            return false;
        }
    }
    return true;
}

function fnd_import_is_locked_row(array $row, array $header_map)
{
    $day = fnd_import_get_row_value($row, $header_map, 'day');
    if ($day === null && isset($row[0])) {
        $day = $row[0];
    }
    return is_string($day) && strcasecmp(trim($day), 'LOCKED') === 0;
}

function fnd_import_add_skip_message(array &$job, $file_name, $row_number, $reason, $value = null)
{
    if (!isset($job['skip_messages']) || !is_array($job['skip_messages'])) {
        $job['skip_messages'] = [];
    }
    if (count($job['skip_messages']) >= 15) {
        return;
    }
    $file_label = sanitize_text_field((string) $file_name);
    $reason_label = sanitize_text_field((string) $reason);
    $message = sprintf('%s row %d: %s', $file_label !== '' ? $file_label : 'file', (int) $row_number, $reason_label);
    if ($value !== null && trim((string) $value) !== '') {
        $value_label = sanitize_text_field((string) $value);
        $message .= sprintf(' (%s)', $value_label);
    }
    $job['skip_messages'][] = $message;
}

function fnd_import_is_csv_upload(array $file)
{
    $filename = trim((string) ($file['name'] ?? ''));
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    if ($ext === 'csv') return true;

    $tmp_name = $file['tmp_name'] ?? '';
    if ($tmp_name && file_exists($tmp_name)) {
        $filetype = wp_check_filetype_and_ext($tmp_name, $filename);
        $detected_ext = strtolower($filetype['ext'] ?? '');
        $detected_type = strtolower($filetype['type'] ?? '');
        if ($detected_ext === 'csv') return true;
        if (in_array($detected_type, ['text/csv', 'text/plain', 'application/vnd.ms-excel'], true)) return true;
    }

    return false;
}

function fnd_import_delete_existing_bookings_chunk($limit = 100)
{
    $query = new WP_Query([
        'post_type' => 'fnd_booking',
        'post_status' => 'any',
        'posts_per_page' => $limit,
        'fields' => 'ids',
    ]);
    if (empty($query->posts)) return 0;
    $count = 0;
    foreach ($query->posts as $post_id) {
        wp_delete_post($post_id, true);
        $count++;
    }
    return $count;
}

function fnd_import_store_job(array $job)
{
    set_transient('fnd_import_job_' . $job['id'], $job, 2 * HOUR_IN_SECONDS);
}

function fnd_import_load_job($job_id)
{
    $job_id = sanitize_text_field($job_id);
    return get_transient('fnd_import_job_' . $job_id);
}

function fnd_import_delete_job($job_id)
{
    $job_id = sanitize_text_field($job_id);
    delete_transient('fnd_import_job_' . $job_id);
}

function fnd_import_process_file_batch(array &$file, array &$job, $batch_size = 50)
{
    if (!isset($file['path']) || !file_exists($file['path'])) {
        $job['errors'] += 1;
        if (count($job['error_messages']) < 5) {
            $job['error_messages'][] = 'Missing file: ' . ($file['name'] ?? 'unknown');
        }
        $file['done'] = true;
        return;
    }

    $handle = fopen($file['path'], 'r');
    if (!$handle) {
        $job['errors'] += 1;
        if (count($job['error_messages']) < 5) {
            $job['error_messages'][] = 'Unable to read CSV: ' . ($file['name'] ?? 'unknown');
        }
        $file['done'] = true;
        return;
    }

    $headers = fgetcsv($handle);
    if (!$headers) {
        fclose($handle);
        $job['errors'] += 1;
        if (count($job['error_messages']) < 5) {
            $job['error_messages'][] = 'CSV is empty: ' . ($file['name'] ?? 'unknown');
        }
        $file['done'] = true;
        return;
    }

    $header_map = isset($file['header_map']) ? $file['header_map'] : null;
    if (!is_array($header_map) || empty($header_map)) {
        [$header_map, $has_date] = fnd_import_build_header_map($headers);
        if (!$has_date) {
            fclose($handle);
            $job['errors'] += 1;
            if (count($job['error_messages']) < 5) {
                $job['error_messages'][] = 'Date column not found: ' . ($file['name'] ?? 'unknown');
            }
            $file['done'] = true;
            return;
        }
        $file['header_map'] = $header_map;
    }

    $skip = isset($file['row_index']) ? (int) $file['row_index'] : 0;
    $skipped = 0;
    while ($skipped < $skip && ($row = fgetcsv($handle)) !== false) {
        $skipped++;
    }

    $processed = 0;
    $row = null;
    while ($processed < $batch_size && ($row = fgetcsv($handle)) !== false) {
        $row_number = (int) $file['row_index'] + 2;
        if ($row === [null] || $row === false || fnd_import_is_blank_row($row)) {
            $file['row_index'] += 1;
            $processed++;
            continue;
        }
        if (fnd_import_is_locked_row($row, $header_map)) {
            $file['row_index'] += 1;
            $processed++;
            continue;
        }

        $date_value = fnd_import_get_row_value($row, $header_map, 'date');
        if ($date_value === null || trim((string) $date_value) === '') {
            $job['skipped'] += 1;
            fnd_import_add_skip_message($job, $file['name'] ?? 'file', $row_number, 'Missing Date');
            $file['row_index'] += 1;
            $processed++;
            continue;
        }
        if (fnd_import_to_timestamp($date_value) === null) {
            $job['skipped'] += 1;
            fnd_import_add_skip_message($job, $file['name'] ?? 'file', $row_number, 'Invalid Date', $date_value);
            $file['row_index'] += 1;
            $processed++;
            continue;
        }

        try {
            $payload = fnd_import_coerce_row($row, $header_map);
        } catch (Throwable $e) {
            $job['errors'] += 1;
            if (count($job['error_messages']) < 5) {
                $job['error_messages'][] = 'Row parse failed in ' . ($file['name'] ?? 'file') . ': ' . $e->getMessage();
            }
            $file['row_index'] += 1;
            $processed++;
            continue;
        }
        if ($payload === null) {
            $job['skipped'] += 1;
            fnd_import_add_skip_message($job, $file['name'] ?? 'file', $row_number, 'Skipped row');
        } else {
            $result = fnd_create_booking_from_payload($payload, [
                'preserve_timestamps' => true,
                'skip_log' => true,
            ]);
            if (is_wp_error($result)) {
                $job['errors'] += 1;
                if (count($job['error_messages']) < 5) {
                    $job['error_messages'][] = $result->get_error_message();
                }
            } else {
                $job['inserted'] += 1;
            }
        }
        $file['row_index'] += 1;
        $processed++;
    }

    $done = feof($handle);
    fclose($handle);

    if ($done) {
        $file['done'] = true;
        if (!empty($file['path']) && file_exists($file['path'])) {
            @unlink($file['path']);
        }
    }
}

function fnd_import_process_job_batch(array &$job, $batch_size = 50, $delete_batch = 50)
{
    if (!empty($job['reset']) && empty($job['reset_done'])) {
        $deleted = fnd_import_delete_existing_bookings_chunk($delete_batch);
        $job['deleted'] += $deleted;
        if ($deleted < $delete_batch) {
            $job['reset_done'] = true;
        }
        return;
    }

    $total_files = count($job['files']);
    if ($job['current_file'] >= $total_files) {
        $job['done'] = true;
        return;
    }

    $file_index = (int) $job['current_file'];
    $file = &$job['files'][$file_index];
    if (!empty($file['done'])) {
        $job['current_file'] += 1;
        return;
    }

    fnd_import_process_file_batch($file, $job, $batch_size);
    if (!empty($file['done'])) {
        $job['current_file'] += 1;
    }
}

function fnd_import_create_job(array $entries, $reset)
{
    $files = [];
    $errors = [];

    foreach ($entries as $file) {
        if (($file['error'] ?? 0) !== UPLOAD_ERR_OK) {
            $errors[] = sprintf('Upload error for %s.', esc_html($file['name'] ?? 'file'));
            continue;
        }

        $filename = trim((string) ($file['name'] ?? 'file'));
        if (!fnd_import_is_csv_upload($file)) {
            $errors[] = sprintf('File %s is not a CSV.', esc_html($filename));
            continue;
        }

        $upload = wp_handle_upload($file, ['test_form' => false, 'test_type' => false]);
        if (isset($upload['error'])) {
            $errors[] = sprintf('Upload failed for %s: %s', esc_html($filename), esc_html($upload['error']));
            continue;
        }

        $path = $upload['file'] ?? '';
        if (!$path || !file_exists($path)) {
            $errors[] = sprintf('File %s could not be stored.', esc_html($filename));
            continue;
        }

        $handle = fopen($path, 'r');
        if (!$handle) {
            $errors[] = sprintf('File %s could not be read.', esc_html($filename));
            @unlink($path);
            continue;
        }
        $headers = fgetcsv($handle);
        fclose($handle);
        if (!$headers) {
            $errors[] = sprintf('File %s is empty.', esc_html($filename));
            @unlink($path);
            continue;
        }
        [$header_map, $has_date] = fnd_import_build_header_map($headers);
        if (!$has_date) {
            $errors[] = sprintf('File %s is missing a Date column.', esc_html($filename));
            @unlink($path);
            continue;
        }

        $files[] = [
            'name' => $filename,
            'path' => $path,
            'header_map' => $header_map,
            'row_index' => 0,
            'done' => false,
        ];
    }

    if (empty($files)) {
        return [null, $errors];
    }

    $job_id = wp_generate_uuid4();
    $job = [
        'id' => $job_id,
        'files' => $files,
        'current_file' => 0,
        'inserted' => 0,
        'skipped' => 0,
        'skip_messages' => [],
        'errors' => 0,
        'error_messages' => [],
        'reset' => (bool) $reset,
        'reset_done' => !(bool) $reset,
        'deleted' => 0,
        'done' => false,
        'started_at' => time(),
    ];
    fnd_import_store_job($job);
    return [$job_id, $errors];
}

function fnd_render_import_page()
{
    if (!current_user_can('manage_options')) {
        wp_die(__('You do not have permission to access this page.'));
    }

    $errors = [];
    $job_id = null;

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['fnd_import_nonce'])) {
        check_admin_referer('fnd_import_action', 'fnd_import_nonce');

        if (empty($_FILES['fnd_import_files'])) {
            $errors[] = 'No files uploaded.';
        } else {
            $files = $_FILES['fnd_import_files'];
            $entries = [];
            if (is_array($files['name'])) {
                foreach ($files['name'] as $i => $name) {
                    $entries[] = [
                        'name' => $name,
                        'type' => $files['type'][$i] ?? '',
                        'tmp_name' => $files['tmp_name'][$i] ?? '',
                        'error' => $files['error'][$i] ?? 0,
                        'size' => $files['size'][$i] ?? 0,
                    ];
                }
            } else {
                $entries[] = $files;
            }

            $reset = !empty($_POST['fnd_import_reset']);
            [$job_id, $job_errors] = fnd_import_create_job($entries, $reset);
            if (!empty($job_errors)) {
                $errors = array_merge($errors, $job_errors);
            }
        }
    }

    echo '<div class="wrap">';
    echo '<h1>First Night Diary Import</h1>';
    echo '<p>Upload one or more CSV files to import bookings. Use reset to replace existing bookings.</p>';

    if (!empty($errors)) {
        echo '<div class="notice notice-error"><p>' . esc_html(implode(' ', $errors)) . '</p></div>';
    }
    if (!empty($job_id)) {
        echo '<div class="notice notice-info"><p>Import started. This page will update as it runs.</p></div>';
        echo '<div id="fnd-import-status" class="notice notice-info"><p>Preparing import...</p></div>';
    }

    echo '<form method="post" enctype="multipart/form-data">';
    wp_nonce_field('fnd_import_action', 'fnd_import_nonce');
    echo '<table class="form-table"><tbody>';
    echo '<tr><th scope="row"><label for="fnd_import_files">CSV Files</label></th>';
    echo '<td><input type="file" id="fnd_import_files" name="fnd_import_files[]" multiple accept=".csv" required></td></tr>';
    echo '<tr><th scope="row">Reset existing</th>';
    echo '<td><label><input type="checkbox" name="fnd_import_reset" value="1"> Delete all existing bookings before import</label></td></tr>';
    echo '</tbody></table>';
    submit_button('Run Import');
    echo '</form>';
    if (!empty($job_id)) {
        $ajax_nonce = wp_create_nonce('fnd_import_ajax');
        echo '<script>
        (function() {
            var jobId = ' . json_encode($job_id) . ';
            var ajaxNonce = ' . json_encode($ajax_nonce) . ';
            var statusEl = document.getElementById("fnd-import-status");
            if (!jobId || !statusEl || typeof ajaxurl === "undefined") return;

            function setStatus(html) {
                statusEl.innerHTML = html;
            }

            function tick() {
                var data = new FormData();
                data.append("action", "fnd_import_process");
                data.append("job_id", jobId);
                data.append("nonce", ajaxNonce);
                fetch(ajaxurl, { method: "POST", credentials: "same-origin", body: data })
                    .then(function(response) {
                        return response.text().then(function(text) {
                            var parsed = null;
                            try { parsed = JSON.parse(text); } catch (e) {}
                            return { ok: response.ok, status: response.status, parsed: parsed };
                        });
                    })
                    .then(function(result) {
                        var resp = result.parsed;
                        if (!resp || !resp.success) {
                            var msg = (resp && resp.data && resp.data.message)
                                ? resp.data.message
                                : ("Import failed. HTTP " + result.status + ".");
                            setStatus("<p>" + msg + "</p>");
                            return;
                        }
                        var info = resp.data || {};
                        var fileInfo = info.file_name ? (" File: " + info.file_name + ".") : "";
                        var phase = info.reset_done ? "Importing" : "Deleting existing bookings";
                        var summary = phase + ". Inserted " + (info.inserted || 0) +
                            ", skipped " + (info.skipped || 0) + ", errors " + (info.errors || 0) +
                            ". Deleted " + (info.deleted || 0) + "." + fileInfo;
                        var skipHtml = "";
                        if (info.skip_messages && info.skip_messages.length) {
                            var items = info.skip_messages.map(function(msg) {
                                return "<li>" + msg + "</li>";
                            }).join("");
                            skipHtml = "<p>Skip report (first " + info.skip_messages.length + "):</p><ul>" + items + "</ul>";
                        }
                        setStatus("<p>" + summary + "</p>" + skipHtml);
                        if (info.done) {
                            var finalMsg = "Import complete. Inserted " + (info.inserted || 0) +
                                ", skipped " + (info.skipped || 0) + ", errors " + (info.errors || 0) +
                                ". Deleted " + (info.deleted || 0) + ".";
                            setStatus("<p>" + finalMsg + "</p>" + skipHtml);
                            return;
                        }
                        setTimeout(tick, 400);
                    })
                    .catch(function() {
                        setStatus("<p>Import failed. Please reload the page and check server logs.</p>");
                    });
            }

            tick();
        })();
        </script>';
    }
    echo '</div>';
}

function fnd_import_process_ajax()
{
    if (!current_user_can('manage_options')) {
        wp_send_json_error(['message' => 'Unauthorized'], 403);
    }

    check_ajax_referer('fnd_import_ajax', 'nonce');

    $job_id = isset($_POST['job_id']) ? sanitize_text_field(wp_unslash($_POST['job_id'])) : '';
    if ($job_id === '') {
        wp_send_json_error(['message' => 'Missing job id'], 400);
    }

    $job = fnd_import_load_job($job_id);
    if (empty($job) || !is_array($job)) {
        wp_send_json_error(['message' => 'Import job not found'], 404);
    }

    $prev_skip = fnd_should_skip_clash_webhook();
    $prev_log = fnd_should_skip_log();
    $prev_preserve = fnd_should_preserve_timestamps();
    $GLOBALS['fnd_skip_clash_webhook'] = true;
    $GLOBALS['fnd_skip_log'] = true;
    $GLOBALS['fnd_preserve_timestamps'] = true;

    try {
        fnd_import_process_job_batch($job, 50, 50);
    } finally {
        if ($prev_skip) {
            $GLOBALS['fnd_skip_clash_webhook'] = true;
        } else {
            unset($GLOBALS['fnd_skip_clash_webhook']);
        }
        if ($prev_log) {
            $GLOBALS['fnd_skip_log'] = true;
        } else {
            unset($GLOBALS['fnd_skip_log']);
        }
        if ($prev_preserve) {
            $GLOBALS['fnd_preserve_timestamps'] = true;
        } else {
            unset($GLOBALS['fnd_preserve_timestamps']);
        }
    }

    $done = !empty($job['done']);
    if (!$done) {
        fnd_import_store_job($job);
    } else {
        fnd_import_delete_job($job_id);
    }

    $current_file = (int) ($job['current_file'] ?? 0);
    $total_files = count($job['files'] ?? []);
    $file_name = '';
    if ($current_file < $total_files && !empty($job['files'][$current_file]['name'])) {
        $file_name = $job['files'][$current_file]['name'];
    }

    wp_send_json_success([
        'done' => $done,
        'inserted' => (int) ($job['inserted'] ?? 0),
        'skipped' => (int) ($job['skipped'] ?? 0),
        'skip_messages' => array_map('esc_html', $job['skip_messages'] ?? []),
        'errors' => (int) ($job['errors'] ?? 0),
        'error_messages' => $job['error_messages'] ?? [],
        'deleted' => (int) ($job['deleted'] ?? 0),
        'reset_done' => !empty($job['reset_done']),
        'current_file' => $current_file + 1,
        'total_files' => $total_files,
        'file_name' => $file_name,
    ]);
}

add_action('admin_menu', function () {
    add_submenu_page(
        'edit.php?post_type=fnd_booking',
        'FND Import',
        'Import',
        'manage_options',
        'fnd-import',
        'fnd_render_import_page'
    );

    add_submenu_page(
        'edit.php?post_type=fnd_booking',
        'FND Settings',
        'Settings',
        'manage_options',
        'fnd-settings',
        'fnd_render_settings_page'
    );
});

add_action('wp_ajax_fnd_import_process', 'fnd_import_process_ajax');

function fnd_render_settings_page()
{
    if (!current_user_can('manage_options')) {
        wp_die(__('You do not have permission to access this page.'));
    }

    $enabled = fnd_tba_reminders_enabled();
    $message = '';
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['fnd_settings_nonce'])) {
        check_admin_referer('fnd_settings_action', 'fnd_settings_nonce');
        $enabled = !empty($_POST['fnd_tba_reminders_enabled']) ? '1' : '0';
        update_option('fnd_tba_reminders_enabled', $enabled);
        $message = 'Settings saved.';
    }

    echo '<div class="wrap">';
    echo '<h1>First Night Diary Settings</h1>';
    if ($message) {
        echo '<div class="notice notice-success"><p>' . esc_html($message) . '</p></div>';
    }
    echo '<form method="post">';
    wp_nonce_field('fnd_settings_action', 'fnd_settings_nonce');
    echo '<table class="form-table"><tbody>';
    echo '<tr>';
    echo '<th scope="row"><label for="fnd_tba_reminders_enabled">TBA reminders</label></th>';
    echo '<td><label><input type="checkbox" name="fnd_tba_reminders_enabled" id="fnd_tba_reminders_enabled" value="1"' . checked($enabled, true, false) . '> Enable TBA reminder emails (30 days before booking date)</label></td>';
    echo '</tr>';
    echo '</tbody></table>';
    submit_button('Save Settings');
    echo '</form>';
    echo '</div>';
}

// ACF: load JSON field groups from this plugin's acf-json directory (if ACF is active)
add_filter('acf/settings/load_json', function ($paths) {
    $paths[] = plugin_dir_path(__FILE__) . 'acf-json';
    return $paths;
});

// ACF: ensure the Date field displays/accepts values while meta stays canonical in ms (UK midnight)
if (function_exists('acf')) {
    // Convert stored ms -> Y-m-d (site TZ) for the ACF UI
    add_filter('acf/load_value/name=date', function ($value, $post_id, $field) {
        if ($value === null || $value === '') return $value;
        // If stored as ms, convert to Y-m-d; if already Y-m-d or d/m/Y or Ymd, normalize to Y-m-d
        if (is_string($value)) {
            if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $value)) return $value;
            if (preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $value, $m)) return sprintf('%04d-%02d-%02d', $m[3], $m[2], $m[1]);
            if (preg_match('/^(\d{8})$/', $value)) return sprintf('%s-%s-%s', substr($value, 0, 4), substr($value, 4, 2), substr($value, 6, 2));
        }
        $ms = fnd_normalize_ms_to_site_midnight($value);
        return fnd_date_str_from_ms($ms);
    }, 10, 3);

    // Convert Y-m-d from ACF UI -> ms at UK midnight for storage
    add_filter('acf/update_value/name=date', function ($value, $post_id, $field) {
        // Store as Y-m-d in 'date'; meta sync hook will maintain 'date_ms'
        return $value;
    }, 10, 3);
}

// --- Admin List Table Columns for fnd_booking ---
add_filter('manage_edit-fnd_booking_columns', function ($columns) {
    // Preserve checkbox and title, inject our meta columns, keep date at end if present
    $new = [];
    foreach ($columns as $key => $label) {
        if ($key === 'cb') $new[$key] = $label;
        if ($key === 'title') $new[$key] = __('Title');
    }
    $new['fnd_date'] = __('Date');
    $new['fnd_venue'] = __('Venue');
    $new['fnd_press'] = __('Press Contact');
    $new['fnd_created'] = __('Created');
    $new['fnd_updated'] = __('Updated');
    return $new;
});

// --- Sync meta when editing in WP editor ---
add_action('save_post_fnd_booking', function ($post_id, $post, $update) {
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (wp_is_post_revision($post_id)) return;
    // Keep title_of_show meta in sync with the editor Title field
    $t = trim((string)$post->post_title);
    if ($t === '') $t = 'TBC';
    $current = get_post_meta($post_id, 'title_of_show', true);
    if ($current !== $t) {
        update_post_meta($post_id, 'title_of_show', sanitize_text_field($t));
    }
    if (!fnd_should_preserve_timestamps()) {
        // Touch the updated timestamp
        update_post_meta($post_id, 'time_stamp', (string)(time() * 1000));
        // Ensure created_at exists
        if (!get_post_meta($post_id, 'created_at', true)) {
            update_post_meta($post_id, 'created_at', (string)(time() * 1000));
        }
    }
}, 10, 3);

// Mirror edits done via custom fields/ACF back to core fields and normalized meta
function fnd_meta_sync_callback($meta_id, $post_id, $meta_key, $meta_value)
{
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'fnd_booking') return;
    static $in = false;
    if ($in) return;
    $in = true;
    try {
        if ($meta_key === 'title_of_show') {
            $t = trim((string)$meta_value);
            if ($t === '') $t = 'TBC';
            if ($post->post_title !== $t) {
                wp_update_post(['ID' => $post_id, 'post_title' => sanitize_text_field($t)]);
            }
        } elseif ($meta_key === 'date') {
            // ACF stores Y-m-d (or similar). Maintain parallel numeric meta and day label.
            $ms = fnd_normalize_ms_to_site_midnight($meta_value);
            update_post_meta($post_id, 'date_ms', (string)$ms);
            $tz = fnd_wp_tz();
            $day = function_exists('wp_date') ? wp_date('l', intval($ms / 1000), $tz) : date('l', intval($ms / 1000));
            update_post_meta($post_id, 'day', $day);
        }
        if (!fnd_should_preserve_timestamps()) {
            // Bump updated timestamp on any change
            update_post_meta($post_id, 'time_stamp', (string)(time() * 1000));
            if (!get_post_meta($post_id, 'created_at', true)) update_post_meta($post_id, 'created_at', (string)(time() * 1000));
        }
    } finally {
        $in = false;
    }
}
add_action('updated_post_meta', 'fnd_meta_sync_callback', 10, 4);
add_action('added_post_meta', 'fnd_meta_sync_callback', 10, 4);

// Track previous "p" value to detect unpencilled updates outside the app
add_filter('update_post_metadata', function ($check, $object_id, $meta_key, $meta_value, $prev_value) {
    if ($meta_key !== 'p') return $check;
    if (get_post_type($object_id) !== 'fnd_booking') return $check;
    if (!isset($GLOBALS['fnd_prev_meta'])) $GLOBALS['fnd_prev_meta'] = [];
    $GLOBALS['fnd_prev_meta'][$object_id]['p'] = get_post_meta($object_id, 'p', true);
    return $check;
}, 10, 5);

add_action('updated_post_meta', function ($meta_id, $object_id, $meta_key, $meta_value) {
    if ($meta_key !== 'p') return;
    if (get_post_type($object_id) !== 'fnd_booking') return;
    if (fnd_should_skip_clash_webhook()) return;

    $old = $GLOBALS['fnd_prev_meta'][$object_id]['p'] ?? null;
    $new = get_post_meta($object_id, 'p', true);
    if ($old === null) return;

    if (fnd_bool_int($old) === 1 && fnd_bool_int($new) === 0) {
        static $sent = [];
        if (!empty($sent[$object_id])) return;
        $sent[$object_id] = true;
        fnd_send_pencil_confirmed_webhook($object_id);
    }
}, 10, 4);

add_action('manage_fnd_booking_posts_custom_column', function ($column, $post_id) {
    switch ($column) {
        case 'fnd_date':
            $ms = get_post_meta($post_id, 'date_ms', true);
            if (!$ms) $ms = fnd_normalize_ms_to_site_midnight(get_post_meta($post_id, 'date', true));
            if ($ms) {
                $tz = fnd_wp_tz();
                $sec = intval($ms) / 1000;
                echo function_exists('wp_date') ? esc_html(wp_date('d/m/Y', $sec, $tz)) : esc_html(date('d/m/Y', $sec));
            } else {
                echo '—';
            }
            break;
        case 'fnd_venue':
            $venue = get_post_meta($post_id, 'venue', true);
            if (!$venue) $venue = get_post_meta($post_id, 'ukt_venue', true);
            if (!$venue) $venue = get_post_meta($post_id, 'affiliate_venue', true);
            if (!$venue) $venue = get_post_meta($post_id, 'other_venue', true);
            echo $venue ? esc_html($venue) : '—';
            break;
        case 'fnd_press':
            $press = get_post_meta($post_id, 'press_contact', true);
            echo $press ? esc_html($press) : '—';
            break;
        case 'fnd_created':
            $ms = get_post_meta($post_id, 'created_at', true);
            if ($ms) {
                $tz = fnd_wp_tz();
                $sec = intval($ms) / 1000;
                echo function_exists('wp_date') ? esc_html(wp_date('d/m/Y H:i', $sec, $tz)) : esc_html(date('d/m/Y H:i', $sec));
            } else {
                echo '—';
            }
            break;
        case 'fnd_updated':
            $ms = get_post_meta($post_id, 'time_stamp', true);
            if ($ms) {
                $tz = fnd_wp_tz();
                $sec = intval($ms) / 1000;
                echo function_exists('wp_date') ? esc_html(wp_date('d/m/Y H:i', $sec, $tz)) : esc_html(date('d/m/Y H:i', $sec));
            } else {
                echo '—';
            }
            break;
    }
}, 10, 2);

add_filter('manage_edit-fnd_booking_sortable_columns', function ($columns) {
    $columns['fnd_date'] = 'fnd_date';
    $columns['fnd_venue'] = 'fnd_venue';
    $columns['fnd_press'] = 'fnd_press';
    $columns['fnd_created'] = 'fnd_created';
    $columns['fnd_updated'] = 'fnd_updated';
    return $columns;
});

add_action('pre_get_posts', function ($query) {
    if (!is_admin() || !$query->is_main_query()) return;
    if ($query->get('post_type') !== 'fnd_booking') return;
    $orderby = $query->get('orderby');
    switch ($orderby) {
        case 'fnd_date':
            $query->set('meta_key', 'date_ms');
            $query->set('orderby', 'meta_value_num');
            break;
        case 'fnd_created':
            $query->set('meta_key', 'created_at');
            $query->set('orderby', 'meta_value_num');
            break;
        case 'fnd_updated':
            $query->set('meta_key', 'time_stamp');
            $query->set('orderby', 'meta_value_num');
            break;
        case 'fnd_venue':
            $query->set('meta_key', 'venue');
            $query->set('orderby', 'meta_value');
            break;
        case 'fnd_press':
            $query->set('meta_key', 'press_contact');
            $query->set('orderby', 'meta_value');
            break;
        default:
            // leave default ordering
            break;
    }
});
function fnd_send_tba_webhook($email, array $items)
{
    [$url, $secret] = fnd_get_tba_webhook_config();
    if (!$url || !$secret) {
        error_log('FND TBA webhook not configured.');
        return;
    }

    $first_date = isset($items[0]['date']) ? (string)$items[0]['date'] : '';
    $payload = [
        'email' => $email,
        'items' => $items,
        'loginUrl' => $first_date ? fnd_frontend_url_with_date($first_date) : fnd_get_frontend_diary_url(),
        'siteName' => wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES),
    ];

    $response = wp_remote_post($url, [
        'timeout' => 15,
        'headers' => [
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $secret,
        ],
        'body' => wp_json_encode($payload),
    ]);

    if (is_wp_error($response)) {
        error_log('FND TBA webhook failed: ' . $response->get_error_message());
        return;
    }

    $code = wp_remote_retrieve_response_code($response);
    if ($code < 200 || $code >= 300) {
        error_log('FND TBA webhook returned HTTP ' . $code);
    }
}
