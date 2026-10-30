# Tabata PWA (MVP)

Tạo set Tabata, hẹn lịch tập (xuất .ics vào lịch điện thoại), bộ đếm có bíp và giọng đọc. Chạy offline, dữ liệu lưu trên máy.

Thiết kế: canvas "Tabata PWA" trang MVP. Tài liệu bàn giao: "Tabata PWA · Tài liệu bàn giao MVP".

## Chạy

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # test logic timeline, lịch, lưu trữ
npm run build    # ra thư mục dist/, deploy lên host tĩnh bất kỳ (Vercel, Netlify, Cloudflare Pages)
npm run preview  # xem bản build, có service worker
```

PWA cần HTTPS (localhost thì không cần). Muốn thử trên điện thoại khi dev: `npm run dev -- --host` rồi mở bằng IP máy tính, nhưng service worker và wake lock chỉ chạy đầy đủ trên HTTPS.

## Còn để sau

Thư viện bài tập có video, màn tiến độ, màn hoàn thành có thang cảm nhận, thông báo đẩy.
