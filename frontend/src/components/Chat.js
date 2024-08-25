import {Form, 
        Button, 
        InputGroup, 
        ListGroup, 
        Container, 
        Col, 
        Row} from "react-bootstrap";
import {Send, PersonCircle} from "react-bootstrap-icons"
import useWebSocket, { ReadyState } from "react-use-websocket"
import { useEffect, useState, useRef } from "react";

function Chat() {
    const [messages, setMessages] = useState([]);

    const [username, setUsername] = useState("");

    const [message, setMessage] = useState("");

    const WS_URL = "ws://127.0.0.1:8765"

    const { sendJsonMessage, lastJsonMessage, readyState} = useWebSocket(
        WS_URL,
        {
            share: true,
            shouldReconnect: () => true,
            onError: () => {alert("Could not send message, please try again in a few minutes!")}
        },
    )

    const onClick = (event) => {
        if (readyState === ReadyState.OPEN) {
            sendJsonMessage({
                method: "message",
                message: message,
                sender: username
            });
            setMessage("");
        }
    }

    useEffect(() => {
        if(lastJsonMessage != null) {
            console.log(lastJsonMessage)
           setMessages([
            ...messages,
            {
                message: lastJsonMessage.message,
                sender: lastJsonMessage.sender
            }
           ]);
        }
    }, [lastJsonMessage])

    useEffect(() => {
        scroll.current.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
          onClick()
        }
      }
    
    const scroll = useRef();

    return (
        <>
        <Container fluid>
            <Row style={{height:"95vh"}}>
                <Col style={{textAlign:'left', borderRight: "3px solid"}} md={3}>
                <h1>Settings</h1>
                    <InputGroup className="mb-3">
                        <InputGroup.Text id="basic-addon1"><PersonCircle/></InputGroup.Text>
                        <Form.Control
                            placeholder="username"
                            aria-label="Message"
                            id="message"
                            value={username}
                            onChange={(event) => { setUsername(event.target.value) }}
                        />
                    </InputGroup>
                </Col>
                <Col style={{textAlign:'left'}}>
                    <h1>Chat</h1>
                    <ListGroup style={{maxHeight: "100px", overflowY: "auto"}}>
                    {messages.map((message)=> {
                        return <ListGroup.Item className="border-0 text-start"><span className={message.sender.startsWith("You") ? "text-primary" : "text-danger"}>{message.sender}:</span> {message.message}</ListGroup.Item>;
                    })}
                    <ListGroup.Item className="border-0 text-start"><span maxHeight={"0px"} ref={scroll}></span></ListGroup.Item>
                    </ListGroup>
                    <InputGroup className="mb-3">
                        <Form.Control
                            placeholder="Type message..."
                            aria-label="Message"
                            id="message"
                            value={message}
                            onKeyDown={handleKeyDown}
                            onChange={(event) => { setMessage(event.target.value) }}
                        />
                        <Button variant="primary" id="send" onClick={onClick}><Send /></Button>
                    </InputGroup>
                </Col>
            </Row>
        </Container>
        </>
    )
}

export default Chat;