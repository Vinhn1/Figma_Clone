/**
 * Component hiển thị con trỏ thời gian thực của tất cả người dùng khác trong phòng
 * Nhận danh sách người dùng từ Liveblocks và render con trỏ cho từng người
 */
import { LiveCursorProps } from "@/types/type";
import React from "react";
import Cursor from "./Cursor";
import { COLORS } from "@/constants";

// LiveCursor nhận props là others (danh sách các user khác trong phòng)
const LiveCursor = ({ others }: LiveCursorProps) => {
  // Duyệt qua từng user khác trong phòng
  return others.map(({ connectionId, presence }) => {
    // Nếu user đó chưa có thông tin vị trí con trỏ thì không render gì cả
    if (!presence?.cursor) return null;
    // Render component Cursor cho từng user khác
    return (
      <Cursor
        key={connectionId} // Mỗi user có một connectionId riêng biệt
        color={COLORS[Number(connectionId) % COLORS.length]} // Gán màu cho từng user dựa vào connectionId
        x={presence.cursor.x} // Tọa độ X của con trỏ
        y={presence.cursor.y} // Tọa độ Y của con trỏ
        message={presence.message} // Tin nhắn chat (nếu có)
      />
    );
  });
};

export default LiveCursor;
