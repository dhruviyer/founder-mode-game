import './App.css';
import Chat from "./components/Chat.js"
import {
  Col,
  Container, 
  Row} from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import Settings from "./components/Settings.js"
import { useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket"
import LaborMarket from './components/LaborMarket.js';
import MyCompany from './components/MyCompany.js';

function App() {

  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState([]);
  const [laborData, setLaborData] = useState({});
  const [outputData, setOutputData] = useState({});
  const [company, setCompany] = useState("");
  const [companyData, setCompanyData] = useState({});

  const WS_URL = "ws://localhost:8081"

  const { sendJsonMessage, lastJsonMessage, readyState} = useWebSocket(
      WS_URL,
      {
          share: true,
          shouldReconnect: () => true,
          onError: () => {},
      },
  )

  const customSendMessage = (message) => {
    console.log(message, readyState);
       
          sendJsonMessage({
              method: "message",
              message: message,
              sender: username
          });
      
  }

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
            console.log(lastJsonMessage)
              if ('employees' in lastJsonMessage) {
                console.log("here!!");
                setLaborData(laborData => {
                  var newData = {};
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
              
                if ('company' in lastJsonMessage) {
                  setCompanyData(companyData => {
                    const record = lastJsonMessage['company'][0];
                    var innerData = {};
                    innerData["name"] = record["name"];
                    innerData["cash"] = record["cash"];
                    innerData["features"] = record["features"];
                    return innerData;
                    }
                    )
                }

                if ('outputs' in lastJsonMessage) {
                  setOutputData(outputData => {
                    var newData = {};
                    lastJsonMessage['outputs'].forEach((record) => {
                        var innerData = {};
                        innerData["name"] = record["name"];
                        innerData["priority"] = record["priority"];
                        innerData["skill"] = record["skill"];
                        innerData["salary"] = record["salary"];
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
            <Settings username={username} setUsername={setUsername} company={company} setCompany={setCompany} sendMessage={customSendMessage}/>
            <Chat username={username} messages={messages} sendMessage={customSendMessage}/>
            <Col>
              <LaborMarket data={laborData}/>
              <MyCompany companyData={companyData} employeeData={outputData}/>
            </Col>
          </Row>
      </Container>
    </div>
  );
}

export default App;
