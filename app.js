const fs = require('fs');
const app = require('express')();
const http = require('https').createServer(
  {
    cert: fs.readFileSync(__dirname + '/cert/cert.pem'),
    key: fs.readFileSync(__dirname + '/cert/cert.key'),
    ciphers: [
      'ECDHE-RSA-AES128-SHA256',
      'DHE-RSA-AES128-SHA256',
      'AES128-GCM-SHA256',
      'RC4',
      'HIGH',
      '!MD5',
      '!aNULL',
    ].join(':'),
  },
  app
);
const io = require('socket.io')(http, {
  cors: {
    origin: 'https://occupy.unsignd.me/',
    methods: ['GET', 'POST'],
  },
});

http.listen(443);

let adminUid;
let gameStarted = false;
let userDataArr = [];
let pendingArr = [];
const hexList = ['#009dff', '#3bb273', '#ff6f69', '#5344a9', '#f2c800'];
let provinceArr = [];

let winnerList = [];

for (let i = 0; i < 5; i++) {
  provinceArr.push({
    owner: null,
    hp: 100,
    id: i,
    x: Math.floor(Math.random() * 101),
    y: Math.floor(Math.random() * 101),
  });
}

const increaseHP = setInterval(() => {
  if (gameStarted) {
    provinceArr.forEach((province) => {
      province.hp = province.hp < 0 ? 0 : province.hp;

      if (typeof province.type !== 'undefined' && province.type === 'flag') {
        if (province.hp < 200) {
          province.hp += 5;
        } else if (province.hp >= 200) {
          province.hp = 200;
        }
      } else {
        if (province.hp < 100) {
          province.hp++;
        } else if (province.hp >= 100) {
          province.hp = 100;
        }
      }
    });
  }
}, 1000);

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

          if (endProvince.owner === startProvince.owner) {
            endProvince.hp++;
          } else {
            endProvince.hp--;
          }

          if (endProvince.hp < 0) {
            endProvince.owner = startProvince.owner;
            endProvince.type = undefined;
            endProvince.hp = 0;
          }

          if (startProvince.hp < pending.amount) {
            pending.amount = startProvince.hp;
          }
        }
      }
    });
  }

  userDataArr.forEach((user) => {
    if (
      provinceArr.filter(
        (province) => province.owner === user.uid || province.owner === null
      ).length === provinceArr.length &&
      gameStarted
    ) {
      setTimeout(() => {
        gameStarted = false;
        pendingArr = [];
        provinceArr = [];
        adminUid = undefined;
        userDataArr = [];

        for (let i = 0; i < 5; i++) {
          provinceArr.push({
            owner: null,
            hp: 100,
            id: i,
            x: Math.floor(Math.random() * 101),
            y: Math.floor(Math.random() * 101),
          });
        }
        winnerList.push(user);
        io.sockets.emit('game_end');
      }, 3000);
    }
  });
}, 100);

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

  socket.on('disconnect', () => {
    if (
      userDataArr.findIndex((userData) => userData.uid === socket.id) !== -1
    ) {
      userDataArr.splice(
        userDataArr.findIndex((userData) => userData.uid === socket.id),
        1
      );
      provinceArr
        .filter((province) => province.owner === socket.id)
        .forEach((province) => {
          province.type = undefined;
          province.owner = null;
        });

      if (gameStarted && userDataArr.length === 0) {
        setTimeout(() => {
          gameStarted = false;
          pendingArr = [];
          provinceArr = [];
          adminUid = undefined;

          for (let i = 0; i < 5; i++) {
            provinceArr.push({
              owner: null,
              hp: 100,
              id: i,
              x: Math.floor(Math.random() * 101),
              y: Math.floor(Math.random() * 101),
            });
          }
          io.sockets.emit('game_end');
        }, 1000);
      }

      if (socket.id === adminUid && userDataArr.length !== 0) {
        adminUid = userDataArr[0].uid;
        io.sockets.emit('admin_changed', adminUid);
      }
    }
  });

  socket.on('join', (nickname) => {
    if (
      userDataArr.length === 0 ||
      userDataArr.find((user) => user.uid === socket.id) === undefined
    ) {
      if (
        provinceArr.filter((province) => province.owner === null).length === 0
      ) {
        socket.emit('error_game_join', '게임에 빈 자리가 없어요.');
      } else {
        hexList.sort(
          (prev, curr) =>
            userDataArr.filter((user) => user.color === prev).length -
            userDataArr.filter((user) => user.color === curr).length
        );

        userDataArr.push({
          name: nickname,
          uid: socket.id,
          color: hexList[0],
        });
        provinceArr.find((province) => province.owner === null).type = 'flag';
        provinceArr.find(
          (province) =>
            province.owner === null &&
            typeof province.type !== 'undefined' &&
            province.type === 'flag'
        ).hp = 200;
        provinceArr.find(
          (province) =>
            province.owner === null &&
            typeof province.type !== 'undefined' &&
            province.type === 'flag'
        ).owner = socket.id;

        socket.emit('load_data', {
          userData: userDataArr,
          provinceData: provinceArr,
        });

        if (userDataArr.length === 1) {
          adminUid = socket.id;
        }

        socket.emit('success_game_join', userDataArr.length === 1);
      }
    } else {
      socket.emit('error_game_join', '이미 게임에 참가중이에요.');
    }
  });

  socket.on('game_start', () => {
    if (socket.id === adminUid && !gameStarted) {
      gameStarted = true;
      io.sockets.emit('success_game_start');
    } else {
      socket.emit('error_game_start', '게임을 시작할 수 없어요.');
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
});
