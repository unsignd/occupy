import { useState, useEffect } from 'react';
import { ArcherContainer, ArcherElement, Relation } from 'react-archer';
import io from 'socket.io-client';
import './Game.css';

const socket = io('http://occupy.웹.한국:3000');

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
  const [nickname, setNickname] = useState<string>();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
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
          zIndex: 3,
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
              : `${winnerList?.length}회 게임에서 ${
                  winnerList[winnerList.length - 1].name
                }님 우승!`}
          </span>
        </p>
      </div>
      <ArcherContainer
        strokeColor="#ec4a57"
        style={{
          width: '100%',
          height: '100%',
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
                top: `${(province.id % 5) * 20}%`,
                left: `calc(${province.x}% - 100px)`,
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
                  {typeof province.type !== 'undefined' &&
                  province.type === 'flag' ? (
                    <i
                      key={province.id}
                      className="fa-solid fa-flag"
                      style={{
                        display: 'table',
                        position: 'relative',
                        top: 12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: 40,
                        color:
                          users?.length === 0 ||
                          province.owner === null ||
                          users?.find((user) => province.owner === user.uid) ===
                            undefined
                            ? '#616161'
                            : users?.find((user) => province.owner === user.uid)
                                ?.color,
                        cursor: 'pointer',
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
                          clickedId.endId === null
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
                        }
                      }}
                    />
                  ) : (
                    <i
                      key={province.id}
                      className="fa-brands fa-fort-awesome"
                      style={{
                        display: 'table',
                        position: 'relative',
                        top: 12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: 50,
                        color:
                          users?.length === 0 ||
                          province.owner === null ||
                          users?.find((user) => province.owner === user.uid) ===
                            undefined
                            ? '#616161'
                            : users?.find((user) => province.owner === user.uid)
                                ?.color,
                        cursor: 'pointer',
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
                          clickedId.endId === null
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
                        }
                      }}
                    />
                  )}
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
          zIndex: 4,
        }}
      >
        현재 유저수: {users?.length}명
      </p>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 'calc(5% + 10px)',
          transform: 'translateX(-50%)',
          zIndex: 4,
        }}
      >
        <input
          placeholder="닉네임을 입력하세요"
          type="text"
          onChange={(e) => setNickname(e.target.value)}
          style={{
            borderRadius: '0.5rem 0 0 0.5rem',
            color: '#010101',
          }}
          disabled={isJoined}
        ></input>
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
    </div>
  );
}

export default Game;
