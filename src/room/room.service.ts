import { Injectable } from '@nestjs/common';

interface User {
  userId: string;
  socketId: string;
}

interface Room {
  roomId: string;
  participants: User[];
}

@Injectable()
export class RoomService {
  private rooms: Room[] = [];

  async createRoom(roomId: string, user: User) {
    const isExistRoom = this.rooms.find((v) => v.roomId === roomId);
    if (!isExistRoom) {
      await this.rooms.push({ roomId, participants: [user] });
    }
  }

  async addUserToRoom(roomId: string, user: User) {
    // check room is exist
    const isExistRoomIndex = this.rooms.findIndex((v) => v.roomId === roomId);

    if (isExistRoomIndex !== -1) {
      this.rooms[isExistRoomIndex].participants.push(user);
    } else {
      await this.createRoom(roomId, user);
    }
  }
}
