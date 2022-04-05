const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: 'https://occupy.unsignd.me',
    // origin: '*',
    methods: ['GET', 'POST'],
  },
});

http.listen(80);

let adminUid;
let gameStarted = false;
let checkActive = true;
let timeout = 0;
let userDataArr = [];
let pendingArr = [];
const hexList = ['#009dff', '#3bb273', '#ff6f69', '#f2c800'];
let provinceArr = [];
let chatList = [];

let winnerList = [];

for (let j = 0; j < 5; j++) {
  for (let i = 0; i < 5; i++) {
    provinceArr.push({
      owner: null,
      hp: 50,
      id: j * 5 + i,
      x: i * 25,
      y: j * 25,
    });
  }
}

provinceArr
  .filter((province) => province.type === undefined)
  .sort(() => Math.random() - 0.5)[0].type = 'military';

for (let i = 0; i < 2; i++) {
  provinceArr
    .filter((province) => province.type === undefined)
    .sort(() => Math.random() - 0.5)[0].type = 'farm';
}

for (let i = 0; i < 3; i++) {
  provinceArr
    .filter((province) => province.type === undefined)
    .sort(() => Math.random() - 0.5)[0].type = 'road';
}

const increaseHP = setInterval(() => {
  if (gameStarted && timeout > 180) {
    provinceArr.forEach((province) => {
      province.hp = province.hp < 0 ? 0 : province.hp;

      if (province.type === 'flag') {
        if (province.hp < 200) {
          province.hp +=
            2 *
            (provinceArr.filter(
              (p) => p.type === 'farm' && p.owner === province.owner
            ).length +
              1);

          province.hp = province.hp > 200 ? 200 : province.hp;
        }
      } else {
        if (province.owner === null) {
          if (province.hp < 50) {
            province.hp +=
              provinceArr.filter(
                (p) => p.type === 'farm' && p.owner === province.owner
              ).length + 1;

            province.hp = province.hp > 100 ? 100 : province.hp;
          }
        } else {
          if (
            (province.hp < 50 && province.type === 'road') ||
            (province.hp < 70 && province.type === 'farm') ||
            (province.hp < 100 && province.type === 'military') ||
            (province.hp < 100 && province.type === undefined)
          ) {
            province.hp +=
              provinceArr.filter(
                (p) => p.type === 'farm' && p.owner === province.owner
              ).length + 1;

            province.hp =
              province.hp > 50 && province.type === 'road' ? 50 : province.hp;
            province.hp =
              province.hp > 70 && province.type === 'farm' ? 70 : province.hp;
            province.hp =
              province.hp > 100 && province.type === 'military'
                ? 100
                : province.hp;
            province.hp =
              province.hp > 100 && province.type === undefined
                ? 100
                : province.hp;
          }
        }
      }
    });
  }
}, 1000);

const gameEnd = setInterval(() => {
  if (gameStarted && timeout === 0) {
    provinceArr.forEach((province) => {
      province.hp--;
    });
  }
}, 10);

const decreaseHP = setInterval(() => {
  if (gameStarted) {
    pendingArr.forEach((pending) => {
      if (
        provinceArr.find(
          (province) =>
            province.id === pending.startId || province.id === pending.endId
        ) !== undefined
      ) {
        if (pending.amount > 150) {
          pending.amount = 150;
        }

        const startProvince = provinceArr.find(
          (province) => province.id === pending.startId
        );
        const endProvince = provinceArr.find(
          (province) => province.id === pending.endId
        );

        if (pending.amount > 0) {
          pending.amount--;
          startProvince.hp--;

          if (endProvince.type !== 'flag') {
            if (endProvince.owner === startProvince.owner) {
              pending.amount -=
                2 *
                  (provinceArr.filter(
                    (p) => p.type === 'road' && p.owner === startProvince.owner
                  ).length +
                    1) -
                1;
              startProvince.hp -=
                2 *
                  (provinceArr.filter(
                    (p) => p.type === 'road' && p.owner === startProvince.owner
                  ).length +
                    1) -
                1;
              endProvince.hp +=
                2 *
                (provinceArr.filter(
                  (p) => p.type === 'road' && p.owner === startProvince.owner
                ).length +
                  1);
            } else {
              endProvince.hp -=
                2 *
                (provinceArr.filter(
                  (p) =>
                    p.type === 'military' && p.owner === startProvince.owner
                ).length +
                  1);
            }
          } else {
            if (endProvince.owner === startProvince.owner) {
              pending.amount -= provinceArr.filter(
                (p) => p.type === 'road' && p.owner === startProvince.owner
              ).length;
              startProvince.hp -= provinceArr.filter(
                (p) => p.type === 'road' && p.owner === startProvince.owner
              ).length;
              endProvince.hp +=
                provinceArr.filter(
                  (p) => p.type === 'road' && p.owner === startProvince.owner
                ).length + 1;
            } else {
              if (
                pendingArr.filter(
                  (p) =>
                    p.amount > 0 &&
                    p.endId === endProvince.id &&
                    provinceArr.find((pp) => pp.id === p.startId).owner !==
                      endProvince.owner
                ).length >= 2
              ) {
                endProvince.hp -=
                  provinceArr.filter(
                    (p) =>
                      p.type === 'military' && p.owner === startProvince.owner
                  ).length + 1;
              }
            }
          }

          if (endProvince.hp < 0) {
            endProvince.owner = startProvince.owner;
            if (endProvince.type === 'flag') {
              endProvince.type = undefined;
            }
            endProvince.hp = 0;
          }

          if (startProvince.hp < pending.amount) {
            pending.amount = startProvince.hp;
          }
        }
      }
    });
  }
}, 300);

const checkGameEnd = setInterval(() => {
  userDataArr.forEach((user) => {
    if (
      provinceArr.filter(
        (province) => province.owner === user.uid || province.owner === null
      ).length === provinceArr.length &&
      gameStarted &&
      checkActive
    ) {
      checkActive = false;
      setTimeout(() => {
        gameStarted = false;
        checkActive = true;
        timeout = 0;
        pendingArr = [];
        provinceArr = [];
        adminUid = undefined;
        userDataArr = [];

        for (let j = 0; j < 5; j++) {
          for (let i = 0; i < 5; i++) {
            provinceArr.push({
              owner: null,
              hp: 50,
              id: j * 5 + i,
              x: i * 25,
              y: j * 25,
            });
          }
        }

        for (let i = 0; i < 2; i++) {
          provinceArr
            .filter((province) => province.type === undefined)
            .sort(() => Math.random() - 0.5)[0].type = 'military';
        }

        for (let i = 0; i < 2; i++) {
          provinceArr
            .filter((province) => province.type === undefined)
            .sort(() => Math.random() - 0.5)[0].type = 'farm';
        }

        for (let i = 0; i < 3; i++) {
          provinceArr
            .filter((province) => province.type === undefined)
            .sort(() => Math.random() - 0.5)[0].type = 'road';
        }

        winnerList.push(user);
        chatList.push(
          {
            contents: `제 ${winnerList.length}회 게임이 끝났습니다!`,
            index: chatList.length,
            color: '#fed501',
          },
          {
            contents: `우승자는 ${user.name}님입니다!`,
            index: chatList.length + 1,
            color: '#fed501',
          }
        );
        io.sockets.emit('load_message', chatList);
        io.sockets.emit('game_end');
      }, 3000);
    }
  });
}, 100);

const checkTimeout = setInterval(() => {
  if (timeout > 0 && gameStarted) {
    timeout--;
    if (timeout === 240) {
      chatList.push({
        contents: `60초 후 모든 성의 체력이 회복되지 않습니다!`,
        index: chatList.length,
        color: '#fed501',
      });
      io.sockets.emit('load_message', chatList);
    } else if (timeout === 180) {
      chatList.push({
        contents: `이제부터 모든 성의 체력이 회복되지 않습니다!`,
        index: chatList.length,
        color: '#fed501',
      });
      io.sockets.emit('load_message', chatList);
    } else if (timeout === 60) {
      chatList.push({
        contents: `60초 후 게임이 종료됩니다!`,
        index: chatList.length,
        color: '#fed501',
      });
      io.sockets.emit('load_message', chatList);
    } else if (timeout === 30) {
      chatList.push({
        contents: `30초 후 게임이 종료됩니다!`,
        index: chatList.length,
        color: '#fed501',
      });
      io.sockets.emit('load_message', chatList);
    } else if (timeout <= 10) {
      chatList.push({
        contents: `${timeout}초 후 게임이 종료됩니다!`,
        index: chatList.length,
        color: '#fed501',
      });
      io.sockets.emit('load_message', chatList);
    }
  } else if (timeout === 0 && gameStarted) {
    chatList.push({
      contents: `한 팀의 성만이 남을 때까지 성의 군사력이 감소합니다!`,
      index: chatList.length,
      color: '#fed501',
    });
    io.sockets.emit('load_message', chatList);
  }
}, 1000);

io.on('connection', (socket) => {
  setInterval(() => {
    socket.emit('load_data', {
      userData: userDataArr,
      provinceData: provinceArr,
      pendingData: pendingArr,
      winnerData: winnerList,
    });
  }, 100);

  socket.emit('load_data', {
    userData: userDataArr,
    provinceData: provinceArr,
    pendingData: pendingArr,
    winnerData: winnerList,
  });

  socket.emit('load_message', chatList);

  socket.on('disconnect', () => {
    if (
      userDataArr.findIndex((userData) => userData.uid === socket.id) !== -1
    ) {
      chatList.push({
        contents: `${
          userDataArr.find((userData) => userData.uid === socket.id).name
        }님이 게임에서 떠났습니다.`,
        index: chatList.length,
        color: '#fed501',
      });
      io.sockets.emit('load_message', chatList);

      userDataArr.splice(
        userDataArr.findIndex((userData) => userData.uid === socket.id),
        1
      );

      provinceArr
        .filter((province) => province.owner === socket.id)
        .forEach((province) => {
          pendingArr
            .filter((pending) => pending.startId === province.id)
            .forEach((p) => {
              p.amount = 0;
            });

          province.type = undefined;
          province.owner = null;
          if (province.hp > 100) {
            province.hp = 100;
          }
        });

      if (gameStarted && userDataArr.length === 0) {
        gameStarted = false;
        pendingArr = [];
        provinceArr = [];
        adminUid = undefined;
        timeout = 0;

        for (let j = 0; j < 5; j++) {
          for (let i = 0; i < 5; i++) {
            provinceArr.push({
              owner: null,
              hp: 50,
              id: j * 5 + i,
              x: i * 25,
              y: j * 25,
            });
          }
        }

        for (let i = 0; i < 2; i++) {
          provinceArr
            .filter((province) => province.type === undefined)
            .sort(() => Math.random() - 0.5)[0].type = 'military';
        }

        for (let i = 0; i < 2; i++) {
          provinceArr
            .filter((province) => province.type === undefined)
            .sort(() => Math.random() - 0.5)[0].type = 'farm';
        }

        for (let i = 0; i < 3; i++) {
          provinceArr
            .filter((province) => province.type === undefined)
            .sort(() => Math.random() - 0.5)[0].type = 'road';
        }

        chatList = [];

        io.sockets.emit('load_message', chatList);
        io.sockets.emit('game_end');
      }

      if (socket.id === adminUid && userDataArr.length !== 0) {
        adminUid = userDataArr[0].uid;
        io.sockets.emit('admin_changed', adminUid);
      }
    }
  });

  socket.on('join', (nickname) => {
    nickname = nickname.substring(0, 22);
    if (gameStarted) {
      socket.emit('error_game_join', '이미 게임이 시작됐어요.');
    } else if (
      userDataArr.length === 0 ||
      userDataArr.find((user) => user.uid === socket.id) === undefined
    ) {
      if (userDataArr.length === 16) {
        socket.emit('error_game_join', '게임의 최대 인원은 16명이예요.');
      } else {
        hexList.sort(
          (prev, curr) =>
            userDataArr.filter((user) => user.color === prev).length -
            userDataArr.filter((user) => user.color === curr).length
        );
        const targetProvince = provinceArr
          .filter(
            (province) => province.owner === null && province.type === undefined
          )
          .sort(() => Math.random() - 0.5)[0];

        userDataArr.push({
          name: nickname,
          uid: socket.id,
          color: hexList[0],
        });

        targetProvince.type = 'flag';
        targetProvince.hp = 200;
        targetProvince.owner = socket.id;

        socket.emit('load_data', {
          userData: userDataArr,
          provinceData: provinceArr,
        });

        if (userDataArr.length === 1) {
          adminUid = socket.id;
        }

        chatList.push({
          contents: `${nickname}님이 게임에 참가했습니다.`,
          index: chatList.length,
          color: '#fed501',
        });
        io.sockets.emit('load_message', chatList);
        socket.emit('success_game_join', userDataArr.length === 1);
      }
    } else {
      socket.emit('error_game_join', '이미 게임에 참가중이에요.');
    }
  });

  socket.on('game_start', () => {
    if (socket.id === adminUid && !gameStarted) {
      if (userDataArr.length >= 2) {
        gameStarted = true;
        chatList = [
          {
            contents: `제 ${winnerList.length + 1}회 게임이 시작되었습니다!`,
            id: 0,
            color: '#fed501',
          },
        ];
        timeout = 600;
        io.sockets.emit('load_message', chatList);
        io.sockets.emit('success_game_start');
      } else {
        socket.emit('error_game_start', '게임 최소 인원은 2명이예요.');
      }
    } else {
      socket.emit(
        'error_game_start',
        `error_game_start: ${adminUid === socket.id}, ${!gameStarted}`
      );
      console.log(adminUid);
      console.log(socket.id);
    }
  });

  socket.on('pending_start', (data) => {
    if (
      pendingArr.find(
        (pending) =>
          pending.startId === data.startId &&
          pending.endId === data.endId &&
          pending.amount > 0
      ) === undefined
    ) {
      pendingArr.push(data);
    }
  });

  socket.on('send_message', ({ nickname, contents }) => {
    chatList.push({
      contents: `${nickname}: ${contents.substring(0, 30)}`,
      index: chatList.length,
      color: '#fff',
    });

    io.sockets.emit('load_message', chatList);
  });

  socket.on('clear_pending', ({ startId, endId }) => {
    if (
      gameStarted &&
      pendingArr.find(
        (pending) =>
          pending.startId === startId &&
          pending.endId === endId &&
          pending.amount > 0
      ) !== undefined
    ) {
      pendingArr.find(
        (pending) =>
          pending.startId === startId &&
          pending.endId === endId &&
          pending.amount > 0
      ).amount = 0;
    }
  });
});
