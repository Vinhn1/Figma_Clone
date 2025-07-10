"use client";
// Component quản lý tính năng live collaboration (cộng tác thời gian thực)
// Sử dụng Liveblocks để đồng bộ trạng thái con trỏ giữa nhiều người dùng
import { useCallback, useEffect, useState } from "react";
import LiveCursor from "./cursor/LiveCursor";
import {
  useBroadcastEvent,
  useEventListener,
  useMyPresence,
  useOthers,
} from "@liveblocks/react";
import { CursorMode, CursorState, ReactionEvent } from "@/types/type";
import CursorChat from "./cursor/CursorChat";
import ReactionSelector from "./reaction/ReactButton";
import FlyingReaction from "./reaction/FlyingReaction";
import useInterval from "@/hooks/useInterval";

const Live = () => {
  // Lấy danh sách user khác (không bao gồm mình)
  const others = useOthers();
  // Lấy giá trị cursor (tọa độ con trỏ của mình) và hàm updateMyPresence để cập nhật presence của chính mình
  const [{ cursor }, updateMyPresence] = useMyPresence() as any;
  // State quản lý trạng thái hiển thị của con trỏ (ẩn/hiện, v.v.)
  const [cursorState, setCursorState] = useState<CursorState>({
    mode: CursorMode.Hidden,
  });

  // State quản lý danh sách các phản ứng (reaction)
  // (Hiện tại chưa dùng, có thể dùng cho các hiệu ứng reaction sau này)
  const [reaction, setReaction] = useState<any[]>([]);

  // Hook để gửi sự kiện reaction cho các user khác
  const broadcast = useBroadcastEvent();

  // Xóa đi các hiệu ứng icon trong một khoảng thời gian
  useInterval(() => {
    setReaction((reaction) => reaction.filter((r) => r.timestamp > Date.now() - 4000))
  }, 1000)

  // Định kỳ (mỗi 100ms), nếu đang ở chế độ Reaction và giữ chuột, thêm một reaction mới vào mảng reaction tại vị trí con trỏ
  useInterval(() => {
    if (
      cursorState.mode === CursorMode.Reaction &&
      cursorState.isPressed &&
      cursor
    ) {
      setReaction((reactions) =>
        reactions.concat([
          {
            point: { x: cursor.x, y: cursor.y },
            value: cursorState.reaction,
            timestamp: Date.now(),
          },
        ])
      );

      // Gửi sự kiện reaction cho các user khác
      broadcast({
        x: cursor.x,
        y: cursor.y,
        value: cursorState.reaction,
      });
    }
  }, 100);

  // Lắng nghe sự kiện reaction từ các user khác
  useEventListener((eventData) => {
    const event = eventData.event as ReactionEvent;
    setReaction((reactions) =>
      reactions.concat([
        {
          point: { x: event.x, y: event.y },
          value: event.value,
          timestamp: Date.now(),
        },
      ])
    );
  });

  // Xử lý sự kiện di chuyển chuột trên vùng canvas
  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    // Nếu không ở chế độ ReactionSelector thì cập nhật vị trí con trỏ
    if (cursor == null || cursorState.mode !== CursorMode.ReactionSelector) {
      const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y;
      updateMyPresence({ cursor: { x, y } });
    }
  }, []);

  // Khi chuột rời khỏi vùng canvas: ẩn con trỏ và xóa message
  const handlePointerLeave = useCallback((event: React.PointerEvent) => {
    setCursorState({ mode: CursorMode.Hidden });
    updateMyPresence({ cursor: null, message: null });
  }, []);

  // Khi nhấn chuột xuống vùng canvas: cập nhật vị trí con trỏ
  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y;
      updateMyPresence({ cursor: { x, y } });
      // Nếu đang ở chế độ Reaction thì set isPressed
      setCursorState((state: CursorState) =>
        cursorState.mode === CursorMode.Reaction
          ? { ...state, isPressed: true }
          : state
      );
    },
    [cursorState.mode, setCursorState]
  );

  // Khi nhả chuột: nếu ở chế độ Reaction thì set isPressed
  const handlePointerUp = useCallback(
    (event: React.PointerEvent) => {
      setCursorState((state: CursorState) =>
        cursorState.mode === CursorMode.Reaction
          ? { ...state, isPressed: true }
          : state
      );
    },
    [cursorState.mode, setCursorState]
  );

  // Lắng nghe phím tắt: / để chat, Escape để ẩn, e để chọn reaction
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
      } else if (e.key === "e") {
        setCursorState({
          mode: CursorMode.ReactionSelector,
        });
      }
    };
    // Ngăn mặc định khi nhấn /
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

  // Hàm chọn reaction (khi chọn emoji)
  const setReactions = useCallback((reaction: string) => {
    setCursorState({
      mode: CursorMode.Reaction,
      reaction,
      isPressed: false,
    });
  }, []);

  return (
    // Vùng canvas chính để theo dõi và hiển thị con trỏ của các user
    <div
      onPointerMove={handlePointerMove} // Theo dõi di chuyển chuột
      onPointerLeave={handlePointerLeave} // Khi chuột rời khỏi vùng
      onPointerDown={handlePointerDown} // Khi nhấn chuột xuống vùng
      onPointerUp={handlePointerUp}
      className="h-[100vh] w-full flex items-center justify-center text-center "
    >
      {/* Tiêu đề ứng dụng */}
      <h1 className="text-2xl text-white">Liveblocks Figma Clone</h1>

      {/* Hiển thị hiệu ứng reaction (emoji bay lên) tại vị trí người dùng tương tác */}
      {reaction.map((r) => (
        <FlyingReaction
          key={r.timestamp.toString()}
          x={r.point.x}
          y={r.point.y}
          timestamp={r.timestamp}
          value={r.value}
        />
      ))}

      {/* Hiển thị chat con trỏ nếu có vị trí con trỏ (của mình) */}
      {cursor && (
        <CursorChat
          cursor={cursor}
          cursorState={cursorState}
          setCursorState={setCursorState}
          updateMyPresence={updateMyPresence}
        />
      )}

      {/* Hiển thị bảng chọn reaction nếu ở chế độ ReactionSelector */}
      {cursorState.mode === CursorMode.ReactionSelector && (
        <ReactionSelector setReaction={setReactions} />
      )}

      {/* Hiển thị con trỏ của các user khác */}
      <LiveCursor others={others} />
    </div>
  );
};

export default Live;
