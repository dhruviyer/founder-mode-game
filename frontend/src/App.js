import './App.css';
import Chat from "./components/Chat.js"
import {
  Container, 
  Row} from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import Settings from "./components/Settings.js"
import { useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket"
import LaborMarket from './components/LaborMarket.js';

function App() {

  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState([]);
  const [laborData, setLaborData] = useState({});
  const [company, setCompany] = useState("");
  const [connectionFlag, setConnectionFlag] = useState(true);

  const WS_URL = "ws://127.0.0.1:8765"

  const { sendJsonMessage, lastJsonMessage, readyState} = useWebSocket(
      WS_URL,
      {
          share: true,
          shouldReconnect: () => true,
          onError: () => {setConnectionFlag(true); alert("Could not send message, please try again in a few minutes!")},
      },
  )

  const customSendMessage = (message) => {
    console.log(message, readyState);
      if (readyState === ReadyState.OPEN) {
          sendJsonMessage({
              method: "message",
              message: message,
              sender: username
          });
      }
  }

  useEffect(() => {
    if(connectionFlag && readyState === ReadyState.OPEN) {
      customSendMessage("heartbeat");
      setConnectionFlag(false);
      }
  }, [readyState, connectionFlag])

  useEffect(() => {
    customSendMessage("registration "+username+" "+company);
  },[company, username])

  useEffect(() => {
      if(lastJsonMessage != null) {
          if(lastJsonMessage.type === "message") {
              setMessages(messages => [
                  ...messages,
                  {
                      message: lastJsonMessage.message,
                      sender: lastJsonMessage.sender
                  }
              ]);
          } else {
              if ('employees' in lastJsonMessage) {
                setLaborData(laborData => {
                  const newData = {...laborData};
                  lastJsonMessage['employees'].forEach((record) => {
                      var innerData = {};
                      innerData["employer"] = record["employer"];
                      innerData["salary"] = record["salary"];
                      innerData["manager"] = record["manager"];
                      innerData["type"] = record["type"];
                      newData[record["name"]] = innerData;
                    })
                    return newData;
                  }
                  )
                }
          }
      }
  }, [lastJsonMessage])


  return (
    <div className="App">
      <Container fluid style={{paddingTop: "1em", height:"95vh"}}>
          <Row style={{paddingTop: "1em", height:"95vh"}}>
            <Settings username={username} setUsername={setUsername} company={company} setCompany={setCompany}/>
            <Chat username={username} messages={messages} sendMessage={customSendMessage}/>
            <LaborMarket data={laborData}/>
          </Row>
      </Container>
    </div>
  );
}

export default App;
