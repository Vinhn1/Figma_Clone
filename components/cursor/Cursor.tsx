/**
 * Component hiển thị con trỏ của một người dùng cụ thể
 * Hiển thị vị trí con trỏ và có thể hiển thị tin nhắn chat
 */
import CursorSVG from "@/public/assets/CursorSVG";
import React from "react";
//  Định nghĩa kiểu dữ liệu cho props
//  color: màu sắc con trỏ, x/y: tọa độ, message: tin nhắn chat (nếu có)
type Props = {
  color: string;
  x: number;
  y: number;
  message: string;
};

// Cursor = ({...}: Props) Function component dùng destructuring và kiểm tra type
const Cursor = ({ color, x , y, message }: Props) => {
  return (
    <div
      className="pointer-events-none absolute top-0 left-0"
      // Sử dụng transform để di chuyển con trỏ đến đúng vị trí (x, y) trên màn hình
      // translateX(x): di chuyển sang phải x pixel, translateY(y): di chuyển xuống y pixel
      style={{ transform: `translateX(${x}px) translateY(${y}px)` }}
    >
      {/* Hiển thị hình con trỏ, có thể truyền màu sắc nếu muốn */}
      <CursorSVG color=""/>
      {/* Message */}
    </div>
  );
};

export default Cursor;
