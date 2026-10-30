# Tabata PWA · Tài liệu bàn giao MVP

Oct 30, 2026 · @Trần Duy Vũ Anh

## Tổng quan

MVP là một PWA chạy offline, làm đúng 3 việc: tạo set Tabata, hẹn lịch tập, và chạy bộ đếm giờ khi tập. Thiết kế nằm ở trang **MVP** trong [canvas Tabata PWA](https://claude.ai/artifact/1gJjPvYjFCH7kL65PswThh), gồm 6 màn.

| Trong MVP | Để sau (trang "Bản đầy đủ" trên canvas) |
| --- | --- |
| Tạo, sửa, xoá set | Thư viện bài tập có video, chi tiết bài tập |
| Hẹn lịch 1 lần hoặc lặp theo thứ, xuất .ics | Thông báo đẩy (web push) |
| Bộ đếm có bíp, giọng đọc, giữ màn hình sáng | Màn hoàn thành có thang cảm nhận, ghi rep |
| Lưu trên máy, sao lưu và nhập lại | Màn tiến độ: chuỗi ngày, biểu đồ, bản đồ nhiệt |
| Cài app ra màn hình chính | Đăng nhập, đồng bộ nhiều máy |

Giao diện tiếng Việt, chỉ có giao diện tối, thiết kế cho điện thoại 390 × 844.

## Design tokens

Màu pha là quy ước quan trọng nhất: lime = tập, xanh dương = nghỉ, cam = chuẩn bị. Ba màu này dùng thống nhất ở bộ đếm, dải thời gian và các chấm nhãn.

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `bg` | #0E0F12 | Nền trang |
| `surface` | #17191D | Thẻ, ô nhập |
| `surface-2` | #22252A | Nút phụ, ô tăng giảm |
| `bar` | #131518 | Thanh điều hướng, thanh chân trang |
| `border` | #2A2D33 | Viền thẻ, ô nhập |
| `border-strong` | #3A3E45 | Viền nét đứt, nền công tắc tắt |
| `text` | #F2F3F5 | Chữ chính |
| `text-2` | #C9CDD2 | Chữ phụ trên thẻ |
| `text-3` | #9AA0A6 | Chú thích, nhãn nhỏ |
| `work` | #C6F432 | Pha tập, nút chính. Chữ trên nền này dùng `bg` |
| `rest` | #5AB4FF | Pha nghỉ. Chữ nhạt trên nền tối dùng #9DD2FF |
| `prep` | #FFB547 | Pha chuẩn bị, cảnh báo nhẹ |

**Font:** Barlow Condensed 700/800 cho số và tiêu đề in hoa. Be Vietnam Pro 400 đến 700 cho toàn bộ chữ còn lại. Nên tự host cả hai font để chạy offline.

**Cỡ chữ:** số đếm giây 168, nhãn pha 44, tiêu đề thẻ 40, tiêu đề trang 26, nội dung 15, chú thích 12 (px).

**Hình khối:** bo góc thẻ 16 đến 24, ô nhập 12 đến 14, nút chính dạng viên thuốc. Khoảng cách theo bước 4, lề trang 20. Mọi vùng chạm tối thiểu 44 × 44, nút tạm dừng trên bộ đếm 88.

## Màn hình MVP

Thanh điều hướng dưới cùng có 3 tab: Hôm nay, Lịch, Mẫu. Cài đặt mở từ nút bánh răng ở Hôm nay. Đang tập và Tạo set là màn toàn trang, không có thanh điều hướng.

| Màn | Route | Thành phần chính | Hành vi |
| --- | --- | --- | --- |
| Hôm nay | `/` | Thẻ buổi tiếp theo, dải tuần 7 ngày, 2 ô bắt đầu nhanh, nút Tạo set mới | Buổi tiếp theo = lịch hẹn gần nhất từ bây giờ. Chưa có lịch thì thẻ mời với nút "Hẹn buổi đầu tiên". Ô nhanh = Tabata gốc và set dùng gần nhất |
| Đang tập | `/run/:setId` | Nhãn pha, số giây trong vòng tiến độ, dải 8 vạch hiệp, set x/y, thời gian còn lại, động tác hiện tại và tiếp theo, 3 nút (lùi, tạm dừng, bỏ qua), tắt tiếng, thoát | Cả nền đổi màu theo pha. Thoát giữa chừng phải xác nhận. Kết thúc ghi lại buổi tập và về Hôm nay |
| Tạo set | `/sets/new`, `/sets/:id` | Tên, nhóm, 6 ô tăng giảm, chip động tác, ô gõ động tác, tổng thời gian, Lưu, Chạy thử | Tổng thời gian tính lại ngay khi đổi số. Bấm Chạy thử không cần lưu |
| Set của tôi | `/sets` | Chip lọc theo nhóm, thẻ set (nhóm, tên, cấu trúc, tổng thời gian), nút Sửa, Lên lịch, Tập | Set có sẵn không sửa được, bấm Sửa sẽ tạo bản sao. Xoá bằng menu trên thẻ, hỏi lại nếu set đang có lịch |
| Lịch tập | `/schedule` | Dải tuần, danh sách buổi đã hẹn, form Hẹn buổi tập (set, ngày bắt đầu, giờ, lặp theo thứ) | Lưu xong thì tạo file .ics và mở bảng chia sẻ hoặc tải về |
| Cài đặt | `/settings` | Âm thanh, trong lúc tập, nhắc lịch, hướng dẫn cài app, sao lưu | Mọi thay đổi lưu ngay, không có nút Lưu |

**Trạng thái cần làm thêm** (chưa vẽ trên canvas): trống dữ liệu lần đầu, đang tạm dừng, xác nhận thoát, set chưa có động tác (bộ đếm chỉ hiện "Tập"), lỗi nhập sao lưu.

## Mô hình dữ liệu

Toàn bộ dữ liệu là một object JSON lưu trong localStorage (khoá tabata:v1): 3 danh sách và một bản ghi cài đặt. Động tác là chuỗi tên nằm ngay trong set, MVP chưa có bảng bài tập riêng.

```ts
type Group = 'fullbody' | 'legs' | 'upper' | 'core';

interface WorkoutSet {
  id: string;            // uuid
  name: string;
  group: Group;
  workSec: number;       // 20
  restSec: number;       // 10
  rounds: number;        // hiệp mỗi set, 8
  sets: number;          // 4
  setRestSec: number;    // nghỉ giữa set, 60
  prepSec: number;       // chuẩn bị, 10
  moves: string[];       // xoay vòng theo hiệp, có thể rỗng
  builtIn: boolean;      // set có sẵn, không sửa trực tiếp
  createdAt: string;     // ISO
  updatedAt: string;
}

interface Schedule {
  id: string;
  setId: string;
  startDate: string;     // 'YYYY-MM-DD'
  time: string;          // 'HH:mm', giờ địa phương
  repeatDays: number[];  // 1 = T2 … 7 = CN, rỗng = 1 lần
  remindBeforeMin: number;
}

interface SessionLog {
  id: string;
  setId: string;
  startedAt: string;
  finishedAt: string;
  roundsDone: number;
  roundsTotal: number;
}

interface Settings {
  beep: boolean;
  voice: boolean;
  voiceLang: 'vi-VN' | 'en-US';
  volume: number;        // 0–1
  vibrate: boolean;
  wakeLock: boolean;
  defaultPrepSec: number;
  remindMode: 'calendar' | 'push';
  lastBackupAt?: string;
}
```

Tổng thời gian một set = prepSec + sets × rounds × (workSec + restSec) + (sets − 1) × setRestSec. Ví dụ 20/10 × 8 × 4 set, nghỉ set 60s, chuẩn bị 10s = 1.150s = 19:10.

Sao lưu = một file JSON `{ version: 1, sets, schedules, logs, settings }`. Nhập lại phải kiểm tra `version` và kiểu dữ liệu trước khi ghi đè.

## Logic timer

Bộ đếm dựng sẵn một danh sách đoạn từ set, rồi chỉ cần biết đã trôi bao nhiêu giây để suy ra đang ở đoạn nào. Không đếm lùi từng giây bằng `setInterval`, vì trình duyệt chạy ngầm sẽ làm lệch.

```ts
type Phase = 'prep' | 'work' | 'rest' | 'setRest';
interface Segment { phase: Phase; sec: number; set: number; round: number; move?: string }

function buildTimeline(s: WorkoutSet): Segment[] {
  const out: Segment[] = [{ phase: 'prep', sec: s.prepSec, set: 1, round: 1 }];
  let i = 0;
  for (let set = 1; set <= s.sets; set++) {
    for (let round = 1; round <= s.rounds; round++) {
      const move = s.moves.length ? s.moves[i++ % s.moves.length] : undefined;
      out.push({ phase: 'work', sec: s.workSec, set, round, move });
      out.push({ phase: 'rest', sec: s.restSec, set, round });
      if (round === s.rounds && set < s.sets) out.push({ phase: 'setRest', sec: s.setRestSec, set, round });
    }
  }
  return out;
}
```

- **Xoay vòng:** chỉ số động tác chạy liên tục qua các hiệp và các set (A B C D A B C D …).
- **Nghỉ cuối hiệp:** hiệp nào cũng có đoạn nghỉ, kể cả hiệp cuối, giống Tabata gốc 8 × 30s = 4 phút. Sau hiệp cuối của mỗi set (trừ set cuối) thêm nghỉ giữa set. Cách tính này khớp với công thức tổng thời gian ở phần trên.
- **Đếm theo mốc thời gian:** lưu `startedAt = performance.now()` và tổng thời gian đã tạm dừng. Mỗi khung hình (`requestAnimationFrame`) tính `elapsed`, tra ra đoạn hiện tại và số giây còn lại. Quay lại từ nền (`visibilitychange`) thì tính lại ngay.
- **Tạm dừng, lùi, bỏ qua:** tạm dừng cộng dồn thời gian dừng. Lùi và bỏ qua nhảy `elapsed` tới đầu đoạn trước hoặc sau.
- **Âm thanh:** bíp ở giây 3, 2, 1 trước khi đổi đoạn bằng Web Audio (`OscillatorNode`, không cần file). Đầu mỗi đoạn đọc "Tập, Burpee" hoặc "Nghỉ" bằng `speechSynthesis`. iPhone chỉ cho phát tiếng sau một lần bấm, nên mở khoá `AudioContext` ngay khi bấm Bắt đầu.
- **Rung:** `navigator.vibrate(200)` khi đổi pha, bỏ qua nếu trình duyệt không hỗ trợ.

## Yêu cầu PWA

App phải mở và tập được khi không có mạng ngay từ lần thứ hai. Không có server, không đăng nhập.

| Yêu cầu | Cách làm | Lưu ý |
| --- | --- | --- |
| Chạy offline | Service worker cache toàn bộ file build và font (vite-plugin-pwa, Workbox) | Có bản mới thì hiện thông báo "Cập nhật", không tự tải lại giữa buổi tập |
| Cài app | `manifest.webmanifest`: tên, icon 192/512 và maskable, `display: standalone`, `theme_color` #0E0F12 | Android: bắt `beforeinstallprompt` cho nút Cài app. iPhone: chỉ hiện hướng dẫn |
| Lưu dữ liệu | `localStorage`, kiểm tra kiểu dữ liệu mỗi lần nạp. Gọi `navigator.storage.persist()` khi mở app | Safari có thể xoá dữ liệu trang web không dùng lâu, nên nhắc sao lưu |
| Giữ màn hình sáng | `navigator.wakeLock.request('screen')` khi bắt đầu, xin lại khi quay về từ nền | Trình duyệt không hỗ trợ thì ẩn cài đặt này |
| Nhắc lịch | Tạo file .ics: mỗi lịch là 1 `VEVENT`, lặp dùng `RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR`, nhắc dùng `VALARM` theo `remindBeforeMin` | Mở bằng `navigator.share` với file nếu được, không thì tải file về. Giờ ghi kèm `TZID=Asia/Ho_Chi_Minh` |
| Sao lưu | Xuất JSON bằng tải file, nhập bằng `<input type="file">` | Ghi `lastBackupAt`, nhắc nếu quá 30 ngày chưa sao lưu |

Thuộc về bản sau, không làm trong MVP: thông báo đẩy. Muốn hẹn giờ bằng thông báo thì cần server gửi web push, và trên iPhone người dùng phải cài app ra màn hình chính trước. Lựa chọn "Thông báo của app" trong Cài đặt tạm thời hiện nhãn "Sắp có".

## Stack, thư mục và nghiệm thu

Code MVP đã dựng bằng **Vite + React 19 + Tailwind CSS 4**, thêm `vite-plugin-pwa` cho service worker và manifest. Không dùng Vike vì app chỉ có một trang, dữ liệu nằm trên máy, điều hướng bằng hash (`#/run/:id`) là đủ và cache offline đơn giản hơn. Dữ liệu lưu bằng `localStorage` (dưới 1 MB), chuyển sang IndexedDB khi có lịch sử dài hoặc video. Công tắc, ô chọn, hộp xác nhận dùng thẻ gốc của trình duyệt, chưa cần shadcn/ui. Token màu khai báo trong `@theme` của `src/index.css`.

```text
src/
  App.tsx           # router theo hash, thông báo có bản mới
  ui.tsx            # Screen, NavBar, Stepper, Toggle, icon
  screens/          # Home, Run, Builder, Sets, Schedule, Settings, WeekStrip
  lib/
    timeline.ts     # buildTimeline, totalSec, segmentAt (+ test)
    store.ts        # localStorage, set mẫu, sao lưu, kiểm tra dữ liệu (+ test)
    ics.ts          # nextOccurrence, tạo và chia sẻ .ics (+ test)
    audio.ts        # bíp Web Audio, speechSynthesis, rung
public/             # icon 192, 512
```

Tiêu chí nghiệm thu:

- [ ] Tạo set 20/10 × 8 × 4, nghỉ set 60s, chuẩn bị 10s: tổng hiện 19:10, chạy hết đúng 19:10 (sai lệch dưới 1 giây)
- [ ] Tắt màn hình 30 giây giữa buổi rồi mở lại: bộ đếm vẫn đúng vị trí
- [ ] Bíp 3-2-1 và giọng đọc chạy trên Safari iPhone và Chrome Android
- [ ] Động tác xoay vòng đúng thứ tự A B C D qua các hiệp và các set
- [ ] Hẹn T2, T4, T6 lúc 18:30: file .ics mở trong Lịch của iPhone và Google Calendar, lặp đúng thứ, nhắc trước 15 phút
- [ ] Bật chế độ máy bay sau lần mở đầu: app vẫn mở, tạo set và tập được
- [ ] Xuất sao lưu, xoá dữ liệu trình duyệt, nhập lại: đủ set và lịch
- [ ] Cài được ra màn hình chính, mở lên không có thanh địa chỉ
- [ ] Mọi nút chạm tối thiểu 44 × 44, chữ đạt tương phản 4.5:1
