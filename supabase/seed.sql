-- Sample catalogue matching lib/demo.ts. Run after the migration (supabase db reset runs it automatically).
-- Images point at /public/img so the shop works before real product photos are uploaded.

insert into public.categories (type, name, slug, sort, image_path) values
  ('clothing', 'Shirts', 'shirts', 1, '/img/hk-935966.jpg'),
  ('clothing', 'Tees & Polos', 'tees-polos', 2, '/img/hk-6311503.jpg'),
  ('clothing', 'Trousers & Cargos', 'trousers-cargos', 3, '/img/hk-6311231.jpg'),
  ('clothing', 'Denim', 'denim', 4, '/img/hk-8505241.jpg'),
  ('clothing', 'Jackets', 'jackets', 5, '/img/hk-19168186.jpg'),
  ('clothing', 'Two-Piece Sets', 'two-piece-sets', 6, '/img/hk-7562644.jpg'),
  ('shoes', 'Sneakers', 'sneakers', 7, '/img/hk-12628400.jpg'),
  ('shoes', 'Loafers & Slides', 'loafers-slides', 8, '/img/hk-935966.jpg')
on conflict (slug) do nothing;

with p(slug, title, cat, naira, colours, img1, img2, is_new, sold_out, featured, age) as (
  values
    ('boxy-oxford-shirt', 'Boxy Oxford Shirt', 'shirts', 145000, array['Bone','Onyx'], 935966, 8505241, true, false, true, 0),
    ('heavyweight-logo-tee', 'Heavyweight Logo Tee', 'tees-polos', 65000, array['Bone','Onyx','Espresso'], 6311503, 6311231, true, false, false, 1),
    ('parachute-cargo', 'Parachute Cargo', 'trousers-cargos', 120000, array['Espresso','Onyx'], 6311231, 8505241, false, false, false, 2),
    ('leather-bomber', 'Leather Bomber', 'jackets', 420000, array['Onyx','Espresso'], 19168186, 7562644, true, false, true, 3),
    ('washed-straight-denim', 'Washed Straight Denim', 'denim', 135000, array['Onyx'], 8505241, 935966, false, false, false, 4),
    ('knit-polo-set', 'Knit Polo Set', 'two-piece-sets', 230000, array['Espresso','Bone'], 7562644, 6311503, false, true, false, 5),
    ('court-leather-sneaker', 'Court Leather Sneaker', 'sneakers', 260000, array['Bone'], 12628400, 8505241, true, false, true, 6),
    ('suede-penny-loafer', 'Suede Penny Loafer', 'loafers-slides', 240000, array['Espresso','Onyx'], 935966, 7562644, false, false, false, 7),
    ('linen-camp-collar-shirt', 'Linen Camp Collar Shirt', 'shirts', 125000, array['Bone','Espresso'], 6311503, 935966, false, false, false, 8),
    ('nylon-overshirt', 'Nylon Overshirt', 'jackets', 210000, array['Onyx'], 19168186, 6311231, false, false, false, 9),
    ('knit-zip-polo', 'Knit Zip Polo', 'tees-polos', 95000, array['Espresso','Bone'], 6311231, 6311503, true, false, false, 10),
    ('black-selvedge-jean', 'Black Selvedge Jean', 'denim', 165000, array['Onyx'], 8505241, 19168186, false, false, false, 11)
),
ins as (
  insert into public.products (slug, title, category_id, price, description, care, is_new, is_featured, created_at)
  select p.slug, p.title, c.id, p.naira * 100,
    case when c.type = 'shoes'
      then 'The ' || p.title || ' is made in small runs. Clean lines, a sharp last and nothing extra.'
      else 'The ' || p.title || ' is cut in Lagos in small runs. Clean lines, a sharp fit through the shoulder and nothing extra.' end,
    case when c.type = 'shoes'
      then 'Full-grain leather upper, leather lining, rubber sole. Wipe clean, store with shoe trees.'
      else 'Premium heavyweight fabric. Cold wash inside out, hang to dry, warm iron.' end,
    p.is_new, p.featured, now() - (p.age || ' days')::interval
  from p join public.categories c on c.slug = p.cat
  on conflict (slug) do nothing
  returning id, slug
),
imgs as (
  insert into public.product_images (product_id, path, alt, sort)
  select ins.id, '/img/hk-' || x.img || '.jpg', p.title || ' — ' || x.label, x.sort
  from ins join p on p.slug = ins.slug
  cross join lateral (values (p.img1, 'front', 0), (p.img2, 'back', 1), (p.img1, 'detail', 2)) as x(img, label, sort)
  returning 1
)
insert into public.product_variants (product_id, size, colour, colour_hex, stock, sku)
select ins.id, s.size, col.colour,
  case col.colour when 'Onyx' then '#0B0907' when 'Bone' then '#F3ECE2' else '#5A3B28' end,
  case when p.sold_out or s.size in ('XXL', '45') then 0 else 6 end,
  upper(left(replace(p.slug, '-', ''), 8)) || '-' || upper(left(col.colour, 3)) || '-' || s.size
from ins
join p on p.slug = ins.slug
join public.categories c on c.slug = p.cat
cross join lateral unnest(p.colours) as col(colour)
cross join lateral unnest(case when c.type = 'shoes' then array['40','41','42','43','44','45'] else array['XS','S','M','L','XL','XXL'] end) as s(size);
