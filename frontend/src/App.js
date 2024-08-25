import logo from './logo.svg';
import './App.css';
import Chat from "./components/Chat.js"
import {
  Container, 
  Col, 
  Row} from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <div className="App">
      <Container style={{paddingTop: "1em", height:"95vh"}}>
          <Chat />
      </Container>
    </div>
  );
}

export default App;
