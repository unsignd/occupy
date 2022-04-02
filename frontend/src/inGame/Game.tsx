import { useState, useEffect } from 'react';
import { ArcherContainer, ArcherElement, Relation } from 'react-archer';
import io from 'socket.io-client';
import './Game.css';

const socket = io('localhost:3000');

function Game() {
  interface IProvince {
    id: number;
    owner: string | null;
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
      }) => {
        setProvinces(data.provinceData);
        setUsers(data.userData);
        setPendings(data.pendingData);
      }
    );

    socket.on('error_game_join', (msg: string) => {
      alert(msg);
    });

    socket.on('success_game_join', () => {
      setIsJoined(true);
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
            top: '50%',
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
                                        {pending.amount} 전송중..
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
                                        {pending.amount} 만큼 이동중..
                                      </p>
                                    </div>
                                  ),
                                })
                              ),
                          ]
                      : undefined
                  }
                >
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
                </ArcherElement>
              </div>
            </div>
          ))}
        </div>
      </ArcherContainer>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '5%',
          transform: 'translateX(-50%)',
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
          onClick={() => socket.emit('join', nickname)}
          style={{
            borderRadius: '0 0.5rem 0.5rem 0',
          }}
          disabled={isJoined}
        >
          {isJoined ? '게임에 참가했어요.' : '게임 참가하기'}
        </button>
      </div>
    </div>
  );
}

export default Game;
