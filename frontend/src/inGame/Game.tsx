import { useState, useEffect } from 'react';
import { ArcherContainer, ArcherElement, Relation } from 'react-archer';
import io from 'socket.io-client';

const socket = io('https://occupy-server.unsignd.me:443/');
// const socket = io('http://localhost:80');

function Game() {
  interface IProvince {
    id: number;
    owner: string | null;
    type?: string;
    hp: number;
    x: number;
    y: number;
  }

  interface IUser {
    name: string;
    uid: string;
    color: string;
  }

  interface IClickedId {
    startId: number | null;
    endId: number | null;
  }

  interface IPeding {
    startId: number;
    endId: number;
    amount: number;
  }

  const [provinces, setProvinces] = useState<Array<IProvince>>();
  const [users, setUsers] = useState<Array<IUser>>();
  const [nickname, setNickname] = useState<string>('occupier');
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [isStart, setIsStart] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [winnerList, setWinnerList] = useState<Array<IUser>>([]);
  const [mousePos, setMousePos] = useState<{
    x: number;
    y: number;
  }>();
  const [clickedId, setClickedId] = useState<IClickedId>({
    startId: null,
    endId: null,
  });
  const [pendings, setPendings] = useState<Array<IPeding>>([]);
  const [message, setMessage] = useState<string>('');
  const [msgList, setMsgList] = useState<
    Array<{
      contents: string;
      index: number;
      color: string;
    }>
  >([]);

  useEffect(() => {
    socket.on(
      'load_data',
      (data: {
        userData: Array<IUser>;
        provinceData: Array<IProvince>;
        pendingData: Array<IPeding>;
        winnerData: Array<IUser>;
      }) => {
        setProvinces(data.provinceData);
        setUsers(data.userData);
        setPendings(data.pendingData);
        setWinnerList(data.winnerData);
      }
    );

    socket.on('admin_changed', (uid: string) => {
      setIsAdmin(socket.id === uid);
    });

    socket.on('error_game_join', (msg: string) => {
      alert(msg);
    });

    socket.on('success_game_join', (isAdmin) => {
      setIsJoined(true);
      setIsAdmin(isAdmin);
    });

    socket.on('success_game_start', () => {
      setIsStart(true);
    });

    socket.on('error_game_start', (msg: string) => {
      alert(msg);
    });

    socket.on('game_end', () => {
      setIsStart(false);
      setIsAdmin(false);
      setIsJoined(false);
    });

    socket.on(
      'load_message',
      (array: Array<{ contents: string; index: number; color: string }>) => {
        setMsgList(array);

        document.getElementById('bottom')!.scrollTop =
          document.getElementById('bottom')!.scrollHeight;
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
      }}
      onMouseMove={(e) => {
        setMousePos({
          x: e.clientX,
          y: e.clientY,
        });
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '100vw',
          height: '100vh',
          zIndex: 4,
          backgroundColor: '#000000',
          opacity: 0.85,
          display: isStart ? 'none' : 'block',
        }}
      >
        <p
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 30,
            fontWeight: 600,
            color: '#007bff',
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          occupy: 온라인 전략 땅따먹기 게임
          <br />
          <span
            style={{
              fontSize: 50,
              fontWeight: 900,
              color: '#fff',
              textAlign: 'center',
              marginTop: '50px !important',
            }}
          >
            {typeof winnerList === 'undefined'
              ? 'ㅤ'
              : winnerList?.length === 0
              ? '첫번째 우승자에 도전해보세요!'
              : `제 ${winnerList?.length}회 게임에서 ${
                  winnerList[winnerList.length - 1].name
                }님 우승!`}
          </span>
        </p>
      </div>
      <ArcherContainer
        strokeColor="#ec4a57"
        style={{
          width: '100vw',
          height: '100vh',
          zIndex: 3,
        }}
      >
        <ArcherElement id="mousePos">
          <div
            style={{
              position: 'absolute',
              top: mousePos?.y,
              left: mousePos?.x,
            }}
          />
        </ArcherElement>
        <div
          style={{
            position: 'relative',
            width: '75vmin',
            height: '75vmin',
            top: 'calc(50% - 50px)',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {provinces?.map((province) => (
            <div
              key={province.id}
              style={{
                position: 'relative',
                display: 'inline',
                top: `calc(${province.y}% - ${(4 / 5) * province.y + 3}px)`,
                left: `calc(${province.x}% - ${(8 / 5) * province.x + 20}px)`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  width: 200,
                  height: 100,
                }}
              >
                <p
                  style={{
                    display: 'inline-block',
                    position: 'relative',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontWeight: 800,
                    fontSize: 18,
                    color:
                      province.owner === null || users?.length === 0
                        ? '#616161'
                        : users?.find((user) => user.uid === province.owner)
                            ?.color,
                  }}
                >
                  {province.owner === null || users?.length === 0
                    ? '무인도'
                    : users?.find((user) => user.uid === province.owner)
                        ?.name}{' '}
                  | {province.hp}
                </p>
                <ArcherElement
                  id={`${province.id}`}
                  relations={
                    (pendings?.length !== 0 &&
                      pendings?.find(
                        (pending) => pending.startId === province.id
                      ) !== undefined) ||
                    clickedId.startId === province.id
                      ? clickedId.startId === province.id &&
                        clickedId.endId === null
                        ? [
                            ...pendings
                              ?.filter(
                                (pending) =>
                                  pending.startId === province.id &&
                                  pending.amount > 0
                              )
                              .map(
                                (pending): Relation => ({
                                  targetId: `${pending.endId}`,
                                  targetAnchor: 'middle',
                                  sourceAnchor: 'middle',
                                  style: {
                                    strokeColor: users?.find(
                                      (user) => user.uid === province.owner
                                    )?.color,
                                    strokeWidth: 4,
                                    endShape: {
                                      circle: {
                                        radius: 1,
                                        fillColor: users?.find(
                                          (user) => user.uid === province.owner
                                        )?.color,
                                        strokeColor: users?.find(
                                          (user) => user.uid === province.owner
                                        )?.color,
                                        strokeWidth: 0.01,
                                      },
                                    },
                                  },
                                  label: (
                                    <div
                                      style={{
                                        padding: '0 12px',
                                        minWidth: 125,
                                        height: 30,
                                        backgroundColor: users?.find(
                                          (user) => user.uid === province.owner
                                        )?.color,
                                        borderRadius: '0.5rem',
                                        zIndex: 2,
                                      }}
                                    >
                                      <p
                                        style={{
                                          position: 'relative',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          fontSize: 16,
                                          fontWeight: 600,
                                          textAlign: 'center',
                                          color: '#fff',
                                        }}
                                      >
                                        {pending.amount}명이 이동중..
                                      </p>
                                    </div>
                                  ),
                                })
                              ),
                            {
                              targetId:
                                clickedId.endId === null
                                  ? 'mousePos'
                                  : `${clickedId.endId}`,
                              targetAnchor: 'middle',
                              sourceAnchor: 'middle',
                              style: {
                                strokeColor: users?.find(
                                  (user) => user.uid === socket.id
                                )?.color,
                                strokeWidth: 4,
                                endShape: {
                                  circle: {
                                    radius: 1,
                                    fillColor: users?.find(
                                      (user) => user.uid === socket.id
                                    )?.color,
                                    strokeColor: users?.find(
                                      (user) => user.uid === socket.id
                                    )?.color,
                                    strokeWidth: 0.01,
                                  },
                                },
                              },
                            },
                          ]
                        : [
                            ...pendings
                              ?.filter(
                                (pending) =>
                                  pending.startId === province.id &&
                                  pending.amount > 0
                              )
                              .map(
                                (pending): Relation => ({
                                  targetId: `${pending.endId}`,
                                  targetAnchor: 'middle',
                                  sourceAnchor: 'middle',
                                  style: {
                                    strokeColor: users?.find(
                                      (user) => user.uid === province.owner
                                    )?.color,
                                    strokeWidth: 4,
                                    endShape: {
                                      circle: {
                                        radius: 1,
                                        fillColor: users?.find(
                                          (user) => user.uid === province.owner
                                        )?.color,
                                        strokeColor: users?.find(
                                          (user) => user.uid === province.owner
                                        )?.color,
                                        strokeWidth: 0.01,
                                      },
                                    },
                                  },
                                  label: (
                                    <div
                                      style={{
                                        padding: '0 12px',
                                        minWidth: 125,
                                        height: 30,
                                        backgroundColor: users?.find(
                                          (user) => user.uid === province.owner
                                        )?.color,
                                        borderRadius: '0.5rem',
                                      }}
                                    >
                                      <p
                                        style={{
                                          position: 'relative',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          fontSize: 16,
                                          fontWeight: 600,
                                          textAlign: 'center',
                                          color: '#fff',
                                        }}
                                      >
                                        {pending.amount}명 이동중..
                                      </p>
                                    </div>
                                  ),
                                })
                              ),
                          ]
                      : undefined
                  }
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      display: 'table',
                      position: 'relative',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                    onClick={() => {
                      if (
                        clickedId.startId === null &&
                        users?.length !== 0 &&
                        province.owner !== null &&
                        province.owner === socket.id
                      ) {
                        setClickedId({
                          startId: province.id,
                          endId: null,
                        });
                      } else if (
                        users?.length !== 0 &&
                        province.owner !== null &&
                        clickedId.startId === province.id
                      ) {
                        setClickedId({
                          startId: null,
                          endId: null,
                        });
                      } else if (
                        clickedId.startId !== null &&
                        clickedId.endId === null &&
                        (province.type !== 'flag' ||
                          provinces.find((p) => p.id === clickedId.startId)
                            ?.type !== 'flag') &&
                        users?.length !== 0 &&
                        pendings.find(
                          (pending) =>
                            pending.endId === province.id && pending.amount > 0
                        ) === undefined
                      ) {
                        setClickedId({
                          startId: null,
                          endId: null,
                        });

                        socket.emit('pending_start', {
                          startId: clickedId.startId,
                          endId: province.id,
                          amount: provinces.find(
                            (province) => province.id === clickedId.startId
                          )?.hp,
                        });
                      } else if (
                        clickedId.startId !== null &&
                        clickedId.endId === null &&
                        (province.type !== 'flag' ||
                          provinces.find((p) => p.id === clickedId.startId)
                            ?.type !== 'flag') &&
                        users?.length !== 0 &&
                        pendings.find(
                          (pending) =>
                            pending.endId === province.id &&
                            pending.amount > 0 &&
                            (provinces.find(
                              (province) => province.id === pending.startId
                            )?.owner === null ||
                              provinces.find(
                                (province) => province.id === pending.startId
                              )?.owner === socket.id)
                        ) !== undefined
                      ) {
                        setClickedId({
                          startId: null,
                          endId: null,
                        });

                        socket.emit('clear_pending', {
                          startId: pendings.find(
                            (pending) => pending.endId === province.id
                          )?.startId,
                          endId: province.id,
                        });
                      }
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: 50,
                        height: 50,
                        backgroundColor: '#00000000',
                        cursor: 'pointer',
                        zIndex: 4,
                        top:
                          typeof province.type !== 'undefined' &&
                          province.type === 'flag'
                            ? 8
                            : 8,
                      }}
                    />
                    <i
                      key={province.id}
                      className={
                        typeof province.type !== 'undefined' &&
                        province.type === 'flag'
                          ? 'fa-solid fa-flag'
                          : 'fa-brands fa-fort-awesome'
                      }
                      style={{
                        fontSize:
                          typeof province.type !== 'undefined' &&
                          province.type === 'flag'
                            ? 40
                            : 50,
                        color:
                          users?.length === 0 ||
                          province.owner === null ||
                          users?.find((user) => province.owner === user.uid) ===
                            undefined
                            ? '#616161'
                            : users?.find((user) => province.owner === user.uid)
                                ?.color,
                        position: 'relative',
                        top:
                          typeof province.type !== 'undefined' &&
                          province.type === 'flag'
                            ? -34
                            : -42,
                      }}
                    />
                  </div>
                </ArcherElement>
              </div>
            </div>
          ))}
        </div>
      </ArcherContainer>
      <p
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 'calc(5% - 20px)',
          transform: 'translateX(-50%)',
          fontSize: 16,
          fontWeight: 500,
          color: '#007bff',
          zIndex: 5,
        }}
      >
        참가자 수: {users?.length}명 | v0.50
      </p>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 'calc(5% + 10px)',
          transform: 'translateX(-50%)',
          zIndex: 5,
        }}
      >
        <input
          placeholder="닉네임을 입력하세요"
          maxLength={22}
          type="text"
          onChange={(e) =>
            setNickname(e.target.value === '' ? 'occupier' : e.target.value)
          }
          style={{
            borderRadius: '0.5rem 0 0 0.5rem',
            color: '#010101',
          }}
          disabled={isJoined}
        />
        <button
          data-primary
          onClick={() => {
            if (!isJoined) {
              socket.emit('join', nickname);
            } else if (isAdmin) {
              socket.emit('game_start');
            }
          }}
          style={{
            borderRadius: '0 0.5rem 0.5rem 0',
          }}
          disabled={(isJoined && !isAdmin) || isStart}
        >
          {isStart
            ? '게임이 시작됐어요.'
            : isJoined
            ? isAdmin
              ? '게임 시작하기'
              : '게임에 참가했어요.'
            : '게임 참가하기'}
        </button>
      </div>
      <div
        style={{
          position: 'fixed',
          width: '18vw',
          height: '40vh',
          top: '60vh',
          backgroundColor: '#272727aa',
          zIndex: 10,
          borderRadius: '0 1rem 0 0',
        }}
      >
        <div
          className="chat_box"
          id="bottom"
          style={{
            height: 'calc(100% - 110px)',
            width: 'calc(100% - 35px)',
            marginTop: 15,
            marginBottom: 9,
            marginLeft: 25,
          }}
        >
          {msgList.map((msg) => (
            <p
              key={msg.index}
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: msg.color,
                marginTop: 5,
              }}
            >
              key={msg.index}
              {msg.contents}
            </p>
          ))}
        </div>
        <input
          placeholder="메시지를 입력하세요"
          maxLength={30}
          type="text"
          onChange={(e) => {
            setMessage(e.target.value);
          }}
          value={message}
          style={{
            position: 'relative',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 80px)',
            color: '#010101',
            height: 35,
            bottom: 10,
            marginTop: 25,
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && message !== '') {
              socket.emit('send_message', {
                nickname: nickname,
                contents: message,
              });

              setMessage('');
            }
          }}
        />
      </div>
    </div>
  );
}

export default Game;
