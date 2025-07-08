"use client";
// Component chính quản lý tính năng live collaboration (Cộng tác thời gian thực)
// Sử dụng Liveblocks để đồng bộ trạng thái con trỏ giữa nhiều người dùng
import { useCallback, useEffect, useState } from "react";
import LiveCursor from "./cursor/LiveCursor";
import { useMyPresence, useOthers } from "@liveblocks/react";
import { CursorMode } from "@/types/type";
import CursorChat from "./cursor/CursorChat";

const Live = () => {
  // Lấy danh sách tất cả người dùng khác đang online trong cùng một room (phòng làm việc)
  const others = useOthers(); // others: danh sách user khác (không bao gồm mình)
  // Lấy giá trị cursor (tọa độ con trỏ của mình) và hàm updateMyPresence để cập nhật presence của chính mình

  // useMyPresence trả về [state, setState] cho presence của user hiện tại
  const [{ cursor }, updateMyPresence] = useMyPresence() as any;
  // State quản lý trạng thái hiển thị của con trỏ (ẩn/hiện, v.v.)
  const [cursorState, setCursorState] = useState({
    mode: CursorMode.Hidden,
  });
  // Hàm handlePointerMove sẽ xử lý sự kiện di chuyển chuột trên vùng canvas/ Khi chuột di chuyển, cập nhật vị trí con trỏ của mình lên server (Liveblocks)
  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    // Tính toán vị trí con trỏ tương đối với phần tử hiện tại
    const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
    const y = event.clientY - event.currentTarget.getBoundingClientRect().y;
    // Cập nhật presence với vị trí mới của con trỏ
    updateMyPresence({ cursor: { x, y } });
  }, []);

  // Hàm này được gọi khi con trỏ chuột rời khỏi vùng canvas
  // Xóa vị trí con trỏ và message (nếu có) khỏi presence
  const handlePointerLeave = useCallback((event: React.PointerEvent) => {
    setCursorState({ mode: CursorMode.Hidden }); // Ẩn con trỏ khi rời khỏi vùng canvas
    updateMyPresence({ cursor: null, message: null }); // Xóa thông tin con trỏ và message khỏi presence
  }, []);

  // Hàm này được gọi khi nhấn chuột xuống vùng canvas
  // Cập nhật vị trí con trỏ tại thời điểm nhấn chuột
  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
    const y = event.clientY - event.currentTarget.getBoundingClientRect().y;
    updateMyPresence({ cursor: { x, y } });
  }, []);

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "/") {
        setCursorState({
          mode: CursorMode.Chat,
          previousMessage: null,
          message: "",
        });
      } else if (e.key === "Escape") {
        updateMyPresence({ message: "" });
        setCursorState({ mode: CursorMode.Hidden });
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
      }
    };

    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.addEventListener("keyup", onKeyUp);
      window.addEventListener("keydown", onKeyDown);
    };
  }, [updateMyPresence]);

  return (
    // Vùng canvas chính để theo dõi và hiển thị con trỏ của các user
    <div
      onPointerMove={handlePointerMove} // Theo dõi di chuyển chuột
      onPointerLeave={handlePointerLeave} // Khi chuột rời khỏi vùng
      onPointerDown={handlePointerDown} // Khi nhấn chuột xuống vùng
      className="h-[100vh] w-full flex items-center justify-center text-center "
    >
      {/* Tiêu đề ứng dụng */}
      <h1 className="text-2xl text-white">Liveblocks Figma Clone</h1>

      {cursor && (
        // Hiển thị chat con trỏ nếu có vị trí con trỏ (của mình)
        <CursorChat
          cursor={cursor}
          cursorState={cursorState} // Truyền state hiển thị con trỏ
          setCursorState={setCursorState} // Hàm cập nhật state con trỏ
          updateMyPresence={updateMyPresence} // Hàm cập nhật presence lên server
        />
      )}

      {/* Truyền danh sách người dùng vào component LiveCursor để hiển thị con trỏ của họ */}
      <LiveCursor others={others} />
    </div>
  );
};

export default Live;
