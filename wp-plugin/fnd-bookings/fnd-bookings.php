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
        'label' => 'Bookings',
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

    register_post_meta('fnd_log', '_fnd_log_entry', [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => false,
        'auth_callback' => function () {
            return current_user_can('edit_posts');
        },
    ]);
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

function fnd_get_clash_webhook_config()
{
    $url = defined('FND_CLASH_WEBHOOK_URL') ? FND_CLASH_WEBHOOK_URL : '';
    $secret = defined('FND_CLASH_WEBHOOK_SECRET') ? FND_CLASH_WEBHOOK_SECRET : '';
    return [$url, $secret];
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
        'date' => $date,
        'booking' => [
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

function fnd_send_clash_webhook($post_id)
{
    if (fnd_should_skip_clash_webhook()) return;

    [$url, $secret] = fnd_get_clash_webhook_config();
    if (!$url || !$secret) {
        error_log('FND clash webhook not configured.');
        return;
    }

    $payload = fnd_get_booking_snapshot($post_id);
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

add_action('add_meta_boxes', function () {
    add_meta_box(
        'fnd_log_entry_payload',
        'Log Payload',
        'fnd_render_log_entry_metabox',
        'fnd_log',
        'normal',
        'default'
    );
});

function fnd_date_str_from_ms($ms)
{
    $tz = fnd_wp_tz();
    $sec = (int) floor(((int)$ms) / 1000);
    return function_exists('wp_date') ? wp_date('Y-m-d', $sec, $tz) : date('Y-m-d', $sec);
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
                $raw_title = isset($p['title_of_show']) ? sanitize_text_field($p['title_of_show']) : '';
                if ($raw_title === '') $raw_title = 'TBC';
                $post_id = wp_insert_post([
                    'post_type' => 'fnd_booking',
                    'post_status' => 'publish',
                    // Keep title as show title or TBC
                    'post_title' => $raw_title,
                ], true);
                if (is_wp_error($post_id)) return $post_id;

                $now = time() * 1000;
                $tz = fnd_wp_tz();
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
                    'time_stamp' => isset($p['time_stamp']) ? (string) intval($p['time_stamp']) : (string) $now,
                    'created_at' => (string) $now,
                ];
                foreach ($meta as $k => $v) {
                    // Evaluate closures (for 'day')
                    if ($v instanceof Closure) {
                        $v = $v();
                        $meta[$k] = $v;
                    }
                    update_post_meta($post_id, $k, $v);
                }
                $stored_meta = fnd_get_booking_meta_snapshot($post_id);
                fnd_bookings_log_action('create', [
                    'route' => $req->get_route(),
                    'method' => $req->get_method(),
                    'post_id' => $post_id,
                    'request' => $p,
                    'stored_meta' => $stored_meta,
                ]);
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
    // Touch the updated timestamp
    update_post_meta($post_id, 'time_stamp', (string)(time() * 1000));
    // Ensure created_at exists
    if (!get_post_meta($post_id, 'created_at', true)) {
        update_post_meta($post_id, 'created_at', (string)(time() * 1000));
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
        // Bump updated timestamp on any change
        update_post_meta($post_id, 'time_stamp', (string)(time() * 1000));
        if (!get_post_meta($post_id, 'created_at', true)) update_post_meta($post_id, 'created_at', (string)(time() * 1000));
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
        fnd_send_clash_webhook($object_id);
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
