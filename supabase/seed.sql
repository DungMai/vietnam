-- Seed data — flagship province (HCM / Sài Gòn) + 1 fixer + 5 verified facts + 1 scam warning
-- Source: 01-PRD.md §The 10 province AI personas, 04-DESIGN/narrative-voice-deck.md §2

begin;

-- =============================================================================
-- 10 Tier-1 provinces (skeleton — HCM has full data, others have admin metadata only)
-- =============================================================================
insert into province (slug, display_name_persona_en, display_name_persona_vi,
                      display_name_admin_en, display_name_admin_vi,
                      persona_archetype_en, persona_archetype_vi, accent_color)
values
  ('hcm',     'Saigon',     'Sài Gòn',    'Ho Chi Minh City', 'TP. Hồ Chí Minh',
   'The hustler cousin who knows every alley',
   'Người anh em đường phố biết từng con hẻm',
   '#C44536'),
  ('hanoi',   'Hanoi',      'Hà Nội',     'Hanoi',            'Hà Nội',
   'The measured cousin who corrects your pronunciation',
   'Người anh em điềm đạm chỉnh lại cách phát âm của bạn',
   '#3D5A80'),
  ('danang',  'Da Nang',    'Đà Nẵng',    'Da Nang',          'Đà Nẵng',
   'The friendly relative with bridges and beaches',
   'Người thân thân thiện với những cây cầu và bãi biển',
   '#2E7D5B'),
  ('hue',     'Huế',        'Huế',        'Hue',              'Huế',
   'The great-aunt who remembers everything in afternoon light',
   'Người dì lớn tuổi nhớ mọi chuyện qua ánh chiều',
   '#5B3A6E'),
  ('khanhhoa','Nha Trang',  'Nha Trang',  'Khanh Hoa',        'Khánh Hòa',
   'The seaside cousin with grilled-seafood opinions',
   'Người anh em ven biển với những lời nhận xét về hải sản nướng',
   '#E89150'),
  ('lamdong', 'Da Lat',     'Đà Lạt',     'Lam Dong',         'Lâm Đồng',
   'The highland cousin in a knitted scarf',
   'Người anh em cao nguyên trong chiếc khăn len',
   '#6B8E4E'),
  ('quangninh','Halong',    'Hạ Long',    'Quang Ninh',       'Quảng Ninh',
   'The bay boatman with steady wind-eye',
   'Người lái thuyền trên vịnh với đôi mắt đọc gió',
   '#4A6B8A'),
  ('angiang', 'An Giang',   'An Giang',   'An Giang',         'An Giang',
   'The Mekong-Phu Quoc cousin reconciling deltas and islands',
   'Người anh em vùng Mekong–Phú Quốc kết nối đồng bằng và đảo',
   '#8FA862'),
  ('haiphong','Hai Phong',  'Hải Phòng',  'Hai Phong',        'Hải Phòng',
   'The port-city cousin with phượng-tree summers',
   'Người anh em thành phố cảng với mùa hè hoa phượng',
   '#B44A2C'),
  ('cantho',  'Can Tho',    'Cần Thơ',    'Can Tho',          'Cần Thơ',
   'The floating-market cousin with coconut and laughter',
   'Người anh em chợ nổi với dừa và tiếng cười',
   '#C49A3A');

-- legacy admin note for An Giang (Phú Quốc merge — post-2025 reform)
update province
   set legacy_admin_note_en = 'Phú Quốc was administered under Kien Giang before the 2025 reform; it is now part of An Giang.',
       legacy_admin_note_vi = 'Phú Quốc trước cải cách 2025 thuộc tỉnh Kiên Giang; nay thuộc An Giang.'
 where slug = 'angiang';

-- =============================================================================
-- 1 seed fixer
-- =============================================================================
insert into fixer (handle, full_name, bio_en, bio_vi, eligible_province_ids, active)
select 'linh-hcm', 'Linh N.',
       'Born in District 4, motorbike-fluent across the city. Verifies prices, routes, and scam patterns monthly.',
       'Sinh ra ở Quận 4, đi xe máy thông thuộc cả thành phố. Hàng tháng xác minh giá cả, tuyến đường, và chiêu lừa.',
       array[(select id from province where slug = 'hcm')],
       true;

-- =============================================================================
-- 1 verification trip
-- =============================================================================
insert into verification_trip (fixer_id, province_id, period_start, period_end, notes_en, notes_vi)
select
    (select id from fixer where handle = 'linh-hcm'),
    (select id from province where slug = 'hcm'),
    date '2026-05-01', date '2026-05-14',
    'Walked D1, D3, D4, airport route. Verified 5 facts. 1 scam pattern persists at SGN arrivals.',
    'Đi qua Q1, Q3, Q4 và tuyến sân bay. Xác minh 5 dữ kiện. 1 chiêu lừa vẫn tồn tại ở sảnh đến SGN.';

-- =============================================================================
-- 5 verified facts for HCM — drafted, then signed, then published
-- =============================================================================
with f as (
    insert into verified_fact (province_id, body_en, body_vi, category, state)
    values
      ((select id from province where slug = 'hcm'),
       'A metered taxi from SGN airport to District 1 costs 250–300k VND. Vinasun and Mai Linh are reliable.',
       'Taxi tính cước từ sân bay SGN về Quận 1 là 250–300 nghìn VNĐ. Vinasun và Mai Linh đáng tin.',
       'price', 'fixer_review'),
      ((select id from province where slug = 'hcm'),
       'If a driver says the meter is broken, walk away — that is the scam.',
       'Nếu tài xế nói đồng hồ hỏng, hãy bước đi — đó chính là chiêu lừa.',
       'scam_pattern', 'fixer_review'),
      ((select id from province where slug = 'hcm'),
       'Bún bò Huế at Cô Bốn (Tu Trinh alley, D4) opens 5:30am and closes when the broth runs out, usually 10am.',
       'Bún bò Huế của Cô Bốn (hẻm Tú Trinh, Q4) mở 5h30 sáng, đóng khi hết nước, thường khoảng 10h.',
       'hours', 'fixer_review'),
      ((select id from province where slug = 'hcm'),
       'Grab and Be apps are both reliable in Saigon. Use them instead of street-hail when prices feel uncertain.',
       'Ứng dụng Grab và Be đều đáng tin ở Sài Gòn. Dùng app thay vì vẫy xe khi không chắc về giá.',
       'price', 'fixer_review'),
      ((select id from province where slug = 'hcm'),
       'The Bitexco observation deck is overpriced for the view. The rooftop bars on Pasteur and Hai Ba Trung give equal views with a drink included.',
       'Đài quan sát Bitexco đắt so với tầm nhìn. Các quán rooftop trên Pasteur và Hai Bà Trưng có view tương đương kèm thức uống.',
       'location', 'fixer_review')
    returning id
)
select count(*) from f;

-- sign all 5 facts with the seed fixer's trip and publish them
with trip as (
    select id from verification_trip where province_id = (select id from province where slug = 'hcm')
    order by created_at desc limit 1
),
fxr as (select id from fixer where handle = 'linh-hcm'),
sigs as (
    insert into fixer_signature (fixer_id, verification_trip_id, fact_id, signed_body_en, signed_body_vi)
    select fxr.id, trip.id, vf.id, vf.body_en, vf.body_vi
      from verified_fact vf, fxr, trip
     where vf.state = 'fixer_review'
    returning id, fact_id
)
update verified_fact vf
   set state = 'published',
       fixer_signature_id = sigs.id,
       verified_at = now(),
       expires_at = now() + interval '30 days'
  from sigs
 where vf.id = sigs.fact_id;

-- =============================================================================
-- 1 active scam warning
-- =============================================================================
insert into scam_warning (province_id, title_en, title_vi, body_en, body_vi, tier, published_at)
select
    (select id from province where slug = 'hcm'),
    'Airport "broken meter" taxi scam — still active',
    'Chiêu lừa "đồng hồ taxi hỏng" tại sân bay — vẫn còn',
    'At Tan Son Nhat arrivals, some unmarked drivers tell tourists the meter is broken and quote a fixed 600–900k VND fare to D1. Walk past them — the metered fare is 250–300k. Use Grab, Be, or the official Vinasun queue.',
    'Tại sảnh đến Tân Sơn Nhất, một số tài xế không nhãn nói với khách rằng đồng hồ hỏng và báo giá cố định 600–900 nghìn VNĐ về Quận 1. Hãy bỏ qua — giá theo đồng hồ chỉ 250–300 nghìn. Dùng Grab, Be hoặc hàng taxi Vinasun chính thức.',
    'alert',
    now();

-- refresh cached quality score for HCM
update province p
   set quality_score_cached = q.score
  from province_quality_score q
 where p.id = q.province_id
   and p.slug = 'hcm';

commit;
