import './App.css';

import {
  Col,
  Container,
  Row,
  Nav,
  Navbar,
  Tab,
  Tabs,
} from "react-bootstrap";

import 'bootstrap/dist/css/bootstrap.min.css';
import Settings from "./components/Settings.js"
import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket"

import LaborMarket from './components/LaborMarket.js';
import MyCompany from './components/MyCompany.js';
import Chat from "./components/Chat.js"
import { AppContext } from './contexts/AppContext.js';

import { Route, Routes, Link } from 'react-router-dom';
import { GearFill } from "react-bootstrap-icons"

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

  const sendMessage = (message, sender=username) => {
    console.log(message, readyState);
       
    sendJsonMessage({
        method: "message",
        message: message,
        sender: sender
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
                    innerData["valuation"] = record["valuation"];
                    innerData["arr"] = record["arr"];
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
                      console.log(newData);
                      return newData;
                    
                    }
                    )
                  }
          }
      }
  }, [lastJsonMessage])


  return (
    <div className="App">
      <Navbar bg="dark" data-bs-theme="dark">
        <Container>
          <Navbar.Brand href="/">Simco</Navbar.Brand>
          <Nav className="me-auto">
            <Link className="nav-link" to="/">Home</Link>
            <Link className="nav-link" to="/settings"><GearFill fill='white' size='1.1em'/></Link>
          </Nav>
        </Container>
      </Navbar>

      <AppContext.Provider value={{
                username, setUsername,
                messages, setMessages,
                company, setCompany,
                laborData, setLaborData,
                outputData, setOutputData,
                companyData, setCompanyData,
                sendMessage
              }}>
      <Container fluid style={{paddingTop: "1em", paddingLeft: "3em", height:"80vh"}}>
          <Row style={{paddingTop: "1em", height:"80vh"}}>
          <Routes>        
            <Route path="/"  element={
              <Row>
                <Col>
                  <Chat/>
                </Col>
                <Col md={4}>
                <Tabs
                    defaultActiveKey="laborMarket"
                    className="mb-3"
                  >
                    <Tab eventKey="laborMarket" title="Labor Market">
                      <LaborMarket/>
                    </Tab>
                    <Tab eventKey="myCompany" title="My Company">
                    <MyCompany/>
                    </Tab>
                  </Tabs>
                  
                  
                </Col>
              </Row>
              } />
            <Route path="/settings" element={<Settings/>}/>
          </Routes>
            
          </Row>
      </Container>
      </AppContext.Provider>
    </div>
  );
}

export default App;
