"use client";

import { useState, useEffect, useCallback } from "react";
import { RoomService, ChatRoom } from "@web/lib/api";
import { ApiResponse } from "@web/lib/api/types";

export function useRooms() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: ApiResponse<ChatRoom[]> = await RoomService.getRooms();
      if (response.success) setRooms(response.data);
      else setError(response.message || "Có lỗi xảy ra");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, []);

  const createRoom = useCallback(
    async (name: string, type: "private" | "group", memberIds?: string[]) => {
      try {
        const response = await RoomService.createRoom({
          name,
          type,
          members: memberIds,
        });
        if (response.success) {
          setRooms((prev) => [response.data, ...prev]);
          return response.data;
        } else {
          setError(response.message || "Không thể tạo phòng");
          throw new Error(response.message || "Không thể tạo phòng");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tạo phòng");
        throw err;
      }
    },
    []
  );

  const updateRoom = useCallback(
    async (roomId: string, data: { name?: string; description?: string }) => {
      try {
        const response = await RoomService.updateRoom(roomId, data);
        if (response.success) {
          setRooms((prev) =>
            prev.map((room) => (room._id === roomId ? response.data : room))
          );
          return response.data;
        } else {
          setError(response.message || "Không thể cập nhật phòng");
          throw new Error(response.message || "Không thể cập nhật phòng");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Không thể cập nhật phòng"
        );
        throw err;
      }
    },
    []
  );

  const deleteRoom = useCallback(async (roomId: string) => {
    try {
      const response = await RoomService.deleteRoom(roomId);
      if (response.success) {
        setRooms((prev) => prev.filter((room) => room._id !== roomId));
      } else {
        setError(response.message || "Không thể xóa phòng");
        throw new Error(response.message || "Không thể xóa phòng");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa phòng");
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async (roomId: string) => {
    try {
      const response = await RoomService.markAllAsRead(roomId);
      if (response.success) {
        setRooms((prev) =>
          prev.map((room) =>
            room._id === roomId ? { ...room, unreadCount: 0 } : room
          )
        );
      } else {
        setError(response.message || "Không thể đánh dấu đã đọc");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể đánh dấu đã đọc"
      );
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return {
    rooms,
    loading,
    error,
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    markAllAsRead,
  };
}
