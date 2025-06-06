import { useRef, useState } from "react";
import { PhaserGameRef, PhaserGame } from "./game/PhaserGame";
import useTwitchOauth from "./hooks/useTwitchOauth";
import { EventBus } from "./game/EventBus";

function App() {
  const phaserRef = useRef<PhaserGameRef | null>(null);
  const [ isGameStart, setIsGameStart ] = useState(false)
  const { twitchState, startOauthConnect, startWebsocket } = useTwitchOauth();

  const handleClickConnectButton = async () => {
    startWebsocket({
      onMessage: (data) => {
        const user = data.event.chatter_user_login;
        // const message = data.event.message.text;
        const message = data.event.reward.title;
        console.log({ user, message })
        EventBus.emit('message', {user, message});
      }
    });
    setIsGameStart(true);
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
      </div>
    </div>
  );
}

export default App;
