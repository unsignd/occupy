const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

http.listen(3000);

const userDataArr = [];
const hexList = ['#009dff', '#3bb273', '#ff6f69', '#5344a9', '#f2c800'];
const provinceArr = [
  {
    owner: null,
    hp: 100,
  },
  {
    owner: null,
    hp: 100,
  },
];

provinceArr.forEach((province) => {
  province.id = provinceArr.indexOf(province);
  province.x = Math.floor(Math.random() * 101);
  province.y = Math.floor(Math.random() * 101);
});

const increaseHP = setInterval(() => {
  provinceArr.forEach((province) => {
    if (province.hp < 100) {
      province.hp++;
    } else if (province.hp >= 100) {
      province.hp = 100;
    }
  });
}, 1000);

io.on('connection', (socket) => {
  console.log(`${socket.id} connected.`);

  setInterval(() => {
    socket.emit('load_data', {
      userData: userDataArr,
      provinceData: provinceArr,
    });
  }, 1000);

  socket.emit('load_data', {
    userData: userDataArr,
    provinceData: provinceArr,
  });

  socket.on('disconnect', () => {
    console.log(`${socket.id} disconnected.`);
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
        hexList.sort((prev, curr) => {
          return (
            userDataArr.filter((user) => user.color === prev).length -
            userDataArr.filter((user) => user.color === curr).length
          );
        });

        userDataArr.push({
          name: nickname,
          uid: socket.id,
          color: hexList[0],
        });
        provinceArr.filter((province) => province.owner === null)[0].owner =
          socket.id;
        socket.emit('load_data', {
          userData: userDataArr,
          provinceData: provinceArr,
        });
        socket.emit('success_game_join');
      }
    }
  });
});
