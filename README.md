# Documentation

## Setup Nest Js
In this project I use PNPM as the package manager. And I have installed Nest on global.

```
nest new project
```

<br />

## Database Design
### User
- **id (int, Primary Key)**: Unique ID for each user.
- **username (string)**
- **firstName (string)**
- **lastName (string)**
- **email (string)**
- **password (string)**: Hashed user password.
- **createdAt (timestamp)**
- **updatedAt (timestamp)**
- **session (references Session)**

### Message
- **id (int, Primary Key)**: Unique ID for each message.
- **to (references User)**: Reference to the message recipient (user).
- **from (references User)**: Reference to the message sender (user).
- **type (string)**: Message type (e.g., text, image, etc.).
- **content (string)**: Message content.
- **createdAt (timestamp)**: Time when the message was created.

### Room
- **id (int, Primary Key)**: Unique ID for each room/group.
- **name (string, unique)**: Room/group name. Can be empty for private rooms.
- **type (string)**: Room type (e.g., private, public).
- **messages (references Message)**: Reference to messages associated with this room.
- **participants (references User)**: Reference to users who are room members.
- **createdAt (timestamp)**: Time when the room was created.

### Session
- **id (int, Primary Key)**: Unique ID for each session.
- **user (references User)**: Reference to the user with an active session.
- **room (references Room)**: Reference to the room associated with the user's session.

<br>

## Authentication && Authorization Based JWT Token
### Register User
Request:
```
POST http://localhost:8080/auth/register
Content-Type: application/json

{
  "firstName": "your-firstname",
  "lastName": "your-lastname",
  "email": "your-email@gmail.com",
  "password": "your-secret-password"
}
```

Response:
```
HTTP/1.1 200 Ok
Content-Type: application/json

{
  "message": "success create account",
  "status": 200
}
```
Possible errors:

| Error Code | Description |
| -----------| ----------- |
| 400 Bad Request | Required fields were invalid, not specified. |

### Register User
Request:
```
GET http://localhost:8080/auth/signin
Content-Type: application/json

{
  "email": "your-email@gmail.com",
  "password": "your-secret-password"
}
```

Response:
```
HTTP/1.1 200 Ok
Content-Type: application/json

{
  "status": 200,
  "message": "success signin",
  "data": {
    "id": "652bf904f...",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NTJiZjkwNGYyYWZkZWE3ZGViYmYxNmY...."
  }
}
```

Possible errors:

| Error Code | Description |
| -----------| ----------- |
| 400 Bad Request | When the account has not been registered or the password is incorrect. |

<br />

## Socket Event

| URL   | Event | Description |
| ------ | --- | ---- |
| localhost | join  | When the socket is open you can join the room by sending the payload according to the requirements |
| localhost  | message  | When the socket is open you can subscribe and listen to get messages from many rooms |

#### Socket Authorization
On the server side, you should extract the access token from the headers and validate it. You can use the `socket.handshake.headers` property to access the custom headers. Example `access_token: jwnshsd....`

Here i'm at once verify whether the user token is valid. If the token is invalid the socket connection is immediately disconnected.

So only users who have registered and whose token is valid can connect to the socket connection.

Here's an implement code:
```javascript
async handleConnection(client: Socket) {
    // prevent connection without access token
    try {
      const token = client?.handshake?.headers?.access_token as string;
      if (!token) {
        client.disconnect();
      }

      const payload = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET_TOKEN,
      });

      if (!payload) {
        client.disconnect();
      }
    } catch (error) {
      client.disconnect();
    }
  }
```

I also implemented single responsibility as Guards. Here I pass token data extraction.

```javascript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WebsocketAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const token = client.handshake.headers.access_token;

    if (!token) {
      return false;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET_TOKEN,
      });

      if (!payload) {
        return false;
      }

      // set user data to socket user
      client.user = payload.sub;

      return true;
    } catch (error) {}
  }
}
```

And how to use the Guard at every socket event.

```javascript
  @SubscribeMessage('message')
  @UseGuards(WebsocketAuthGuard)
  async handleMessageEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: Event<EventMessage>
  ) {}
```

#### Join Event
The Join event is only used when the user wants to create a room for group messages.

Payload example:
```json
{
  "roomId": "iu123qwe...",
  "type": "group"
}
```

When used in group type rooms, if you want to create a new group, you can fill in the roomId with the group name. Examples ```"roomId": "test-room"```.

Behind that there is a service that checks whether the group name already exists. If it already exists, just add the user as a participant group.

#### Message Event
In this event users can send a message as a group message or private message.

Payload example: 
```json
{
  "roomId": "jsh823...",
  "type": "group || private",
  "data": {
    "to": "recipient_id...",
    "type": "text",
    "content": "your-content-message"
  }
}
```

**Use for Group Message** <br>
When using messages, group type and data.to must be empty.
```json
{
  "roomId": "room-group-id..."
  "data": {
    "type": "text",
    "content": "your-group-message-content"
  }
}
```


**Use for Private Message** <br>
Filling in <b>Type and To is required</b> if the client wants to send a private message. Example use for private message:
```json
{
  "roomId": "room-private-id...",
  "type": "private",
  "data": {
    "to": "recipient_id...",
    "type": "text",
    "content": "your-private-message-content"
  }
}
```

Code implementations:

```javascript
@SubscribeMessage('message')
  @UseGuards(WebsocketAuthGuard)
  async handleMessageEvent(
    @ConnectedSocket() client: any,
    @MessageBody() payload: Event<EventMessage>,
  ) {
    payload.data.from = client.user;
    payload.data.createdAt = new Date();

    // private message
    if (payload.data.to && payload.type === 'private') {
      const room = await this.roomService.createPrivateRoom(
        payload.roomId,
        payload.data.from,
        payload.data.to,
      );

      const resMessage = await this.messageService.saveMessage(
        room,
        payload.data,
      );

      client.emit('message', resMessage);
      client.broadcast.to(room).emit('message', resMessage);
    } else {
      // group message
      const resMessage = await this.messageService.saveMessage(
        payload.roomId,
        payload.data,
      );

      client.emit('message', resMessage);
      client.broadcast.to(payload.roomId).emit('message', resMessage);
    }
  }
```

Functionality

If the message type is 'private' and a recipient is specified (`payload.data.to`), it creates a private room for the conversation and saves the message to that room.
   - It uses the `roomService` to create a private room.
   - It uses the `messageService` to save the message.
   - It emits the saved message to the client that sent the message and broadcasts it to all clients in the private room.

If the message type is not 'private' or no recipient is specified, it treats the message as a group message and saves it to the specified room.
   - It uses the `messageService` to save the message.
   - It emits the saved message to the client that sent the message and broadcasts it to all clients in the specified room.

#### Client Connecting
This module manages socket connections, ensuring authentication, and handling room joins and message history.

```javascript
async handleConnection(client: Socket) {
    // prevent connection without access token
    try {
      const token = client?.handshake?.headers?.access_token as string;
      if (!token) {
        client.disconnect();
      }

      const payload = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET_TOKEN,
      });

      if (!payload) {
        client.disconnect();
      }

      // handle auto join when first connecting
      const rooms = await this.sessionService.getRoomSessionByUserId(
        payload.sub,
      );

      // handle view past messages when they join a chat room.
      rooms.forEach(async (v) => {
        client.join(v);

        const messages = await this.messageService.getMessagesByRoomId(v);

        messages.forEach((msg) => {
          client.emit('message', { roomId: v, data: msg });
        });
      });
    } catch (error) {
      client.disconnect();
    }
  }
```

Functionality:
1. Detects and authenticates the WebSocket connection using the provided access token from the connection's headers.

2. Checks the presence of an access token; if absent, the connection is disconnected.

3. Verifies the access token using the JWT (JSON Web Token) service with the appropriate secret key.

4. If token verification fails, the connection is also disconnected.

5. Upon successful authentication, manages automatic room joins when initially connecting.

6. Retrieves the list of chat rooms contacted by the user with the corresponding user ID.

7. Joins each chat room and sends previous chat messages to the newly connected client.


# For improvement scalability in this codebase 
1. Track data by version <br>
   For example to retrieve previous message data. No need to query everything but apply the latest version that the client cache has.
2. Manage client connection <br>
   For example, when the client is disconnected, it must be removed from the connection room.
3. Timeout connection<br>
   If a client doesn't respond within a certain time limit, you can disconnect and treat them as a disconnected client.
4. Using a reconnection mechanism


<br>
<br>

## Thanks You
