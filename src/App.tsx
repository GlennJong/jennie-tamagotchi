import { useRef, useState } from "react";
import { PhaserGameRef, PhaserGame } from "./game/PhaserGame";
import useTwitchOauth from "./hooks/useTwitchOauth";
import { EventBus } from "./game/EventBus";

function App() {
  const phaserRef = useRef<PhaserGameRef | null>(null);
  const [ isGameStart, setIsGameStart ] = useState(false)
  const { twitchState, startOauthConnect, startWebsocket } = useTwitchOauth();

  const [ temp, setTemp ] = useState([]);
  const tempRef = useRef([]);

  const handleClickConnectButton = async () => {
    startWebsocket({
      onMessage: (data) => {
        const user = data.event.chatter_user_login;
        const message = data.event.reward.title;
        console.log({ user, message })

        tempRef.current.push({ user, message });
        setTemp(tempRef.current);
        
        EventBus.emit('message', {user, message});
      }
    });
    setIsGameStart(true);
  }

  const handleClickManualBattle = (user: string, message: string) => {
    EventBus.emit('message', {user, message});
  }

  
  return (
    <div id="app">
      
      <div style={{ zIndex: 1, position: "relative" }}>
        {
          !twitchState &&
          <button className="button" onClick={startOauthConnect}>Twitch login</button>
        }
        { (!isGameStart && twitchState) &&
          <button className="button" onClick={handleClickConnectButton}>Start Connect</button>
        }
        { isGameStart &&
          <PhaserGame ref={phaserRef} currentActiveScene={undefined} />
        }
        { isGameStart &&
          <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <button className="button" onClick={() => handleClickManualBattle('test', 'dead')}>HP=3</button>
              <button className="button" onClick={() => handleClickManualBattle('test', 'live')}>HP=100</button>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
              <button className="button" onClick={() => handleClickManualBattle('test', '貝貝打招呼')}>battle 貝貝</button>
              <button className="button" onClick={() => handleClickManualBattle('test', '上上打招呼')}>battle 上上</button>
              <button className="button" onClick={() => handleClickManualBattle('bloloblolo', '貝貝打招呼')}>battle BBB</button>
              <button className="button" onClick={() => handleClickManualBattle('touching0212', '貝貝打招呼')}>battle 踏青</button>
              <button className="button" onClick={() => handleClickManualBattle('curry_cat', '貝貝打招呼')}>battle curry_cat</button>
            </div>
            <div>
              { twitchState && JSON.stringify(twitchState) }
              { temp.map((_item, i) => 
                <div key={i}>
                  {_item.user}: {_item.message}
                </div>
              ) }
            </div>
          </div>
        }
        
      </div>
    </div>
  );
}

export default App;
