import {Form, 
        Button, 
        InputGroup, 
        ListGroup, 
        Col} from "react-bootstrap";
import {Send} from "react-bootstrap-icons"
import { useEffect, useState, useRef } from "react";

function Chat({username, messages, sendMessage}) {

    const [message, setMessage] = useState("");


    const onClick = (event) => {
        sendMessage(message);
        setMessage("");
    }

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
        <Col style={{textAlign:'left', borderRight: "3px solid"}}>
            <h1>Chat</h1>
            <ListGroup style={{maxHeight: "50vh", minHeight: "50vh", overflowY: "auto"}}>
            {messages.map((message, index)=> {
                return <ListGroup.Item key={index} className="border-0 text-start"><span className={message.sender.startsWith("You") ? "text-primary" : "text-danger"}>{message.sender}:</span> {message.message}</ListGroup.Item>;
            })}
            <ListGroup.Item className="border-0 text-start"><span maxheight={"0px"} ref={scroll}></span></ListGroup.Item>
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
    )
}

export default Chat;