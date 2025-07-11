import { useRef, useState } from "react";
import { PhaserGame } from "./PhaserGame";
import useTwitchOauth from "./hooks/useTwitchOauth";
import { EventBus, setGlobalData, getGlobalData } from './game/EventBus';
import Console from "./game/Console";
import ColorPicker from './ColorPicker';

const isDev = import.meta.env['VITE_ENV'] === 'dev';

function App() {
  const [ isGameStart, setIsGameStart ] = useState(false);
  const { twitchState, startOauthConnect, startWebsocket } = useTwitchOauth();
  const [ record, setRecord ] = useState<{user?: string, content?: string}[]>([]);
  const [ bgColor, setBgColor ] = useState('#482e79');
  const recordRef = useRef<{user?: string, content?: string}[]>([]);

  const handleClickConnectButton = async () => {
    startWebsocket('chat', {
      onMessage: (data) => {
        const { user, content } = data;
        EventBus.emit('queue', { user, content });
        recordRef.current.push({ user, content });
        setRecord(recordRef.current);
      }
    });
    setIsGameStart(true);
  }

  const handleClickManualBattle = (user: string, content: string) => {
    setGlobalData('message_queue', [
      ...getGlobalData('message_queue'),
      { user, content }
    ]);
  }

  
  return (
    <div id="app" style={{ background: bgColor }}>
      
      <div style={{ zIndex: 1, position: "relative" }}>
        {
          !twitchState &&
          <button className="button" onClick={startOauthConnect}>Twitch login</button>
        }
        { twitchState &&
          <div style={{ position: 'relative' }}>
            { !isGameStart &&
              <button
                className="button"
                onClick={handleClickConnectButton}
                style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 2, boxShadow: '2px 4px 12px hsla(0, 0%, 0%, .33)' }}>
                  Start Connect
              </button>
            }
            <div style={{ opacity: !isGameStart ? 0.5 : 1, pointerEvents: isGameStart ? 'auto': 'none' }}>
              <Console>
                { isGameStart &&
                  <PhaserGame />
                }
              </Console>
            </div>
          </div>
        }
        { isDev && isGameStart &&
          <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <button className="button" onClick={() => setGlobalData('tamagotchi_level', 1)}>
                level=1
              </button>
              <button className="button" onClick={() => setGlobalData('tamagotchi_coin', 0)}>
                coin=0
              </button>
              <button className="button" onClick={() => setGlobalData('tamagotchi_coin', getGlobalData('tamagotchi_coin') + 20)}>
                coin+20
              </button>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
              <button className="button" onClick={() => handleClickManualBattle('test', '補充水分')}>補充水分</button>
              <button className="button" onClick={() => handleClickManualBattle('test', '貝貝打招呼')}>battle 貝貝</button>
              <button className="button" onClick={() => handleClickManualBattle('test', '上上打招呼')}>battle 上上</button>
            </div>
            <div>
              { twitchState && JSON.stringify(twitchState) }
              { record.map((_record, i) => 
                <div key={i}>
                  {_record.user}: {_record.content}
                </div>
              ) }
            </div>
          </div>
        }
      </div>
      <ColorPicker
        defaultColor={bgColor}
        onChange={color => setBgColor(color)}
      />
    </div>
  );
}

export default App;
