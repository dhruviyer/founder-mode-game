import {Form, 
        Button, 
        InputGroup, 
        ListGroup, 
        Row,
        Col} from "react-bootstrap";
import {Send} from "react-bootstrap-icons"
import { useEffect, useState, useRef, useContext} from "react";
import { AppContext } from "../contexts/AppContext";


function Chat() {

    const {messages, sendMessage} = useContext(AppContext);

    const [message, setMessage] = useState("");

    const [chat, setChat] = useState("");

    const refreshChats = () => {
        let newChats = {
            "(New Chat)": [],
            "admin": [],
        }

        messages.forEach(msg => {
            let _chat = msg.sender.replace("You (to ", "").replace(")", "");
            if (!(_chat in newChats)){
                newChats[_chat] = []
            }
            newChats[_chat].push({
                "sender": msg.sender.startsWith("You") ? "You" : msg.sender,
                "message": msg.message
            })
        })
        return newChats
    }

    const [chats, setChats] = useState(refreshChats())

    const onClick = (event) => {
        

        if (chat !== "(New Chat)"){
            sendMessage("/"+chat.toLowerCase()+" "+message);
        } else if (chat !== "") {
            setChat(message.split(" ")[0].substring(1));
            sendMessage(message);
        }
        setMessage("");
    }

    useEffect(() => {
        scroll.current.scrollIntoView({ behavior: "smooth" });
        setChats(refreshChats())
    
    }, [messages]);

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
          onClick()
        }
      }
    
    const scroll = useRef();

    return (
        <div style={{textAlign:'left'}}>
            <h1>Chat</h1>
            <Row>
                
            <Col md={5}>
                <ListGroup>
                {
                    chats && Object.keys(chats).map((chatName) => {
                    return(<ListGroup.Item key={chatName} action active={chatName === chat} onClick={()=>setChat(chatName)}>
                        {chatName}
                        <br>
                        </br>
                        <i>{chats[chatName].at(-1) && (chats[chatName].at(-1).sender === "You" ? ("You: "):"")+chats[chatName].at(-1).message}</i>
                    </ListGroup.Item>);
                    })
                }
                </ListGroup>
            </Col>
            <Col>
            <ListGroup style={{maxHeight: "50vh", minHeight: "50vh", overflowY: "auto"}}>
            {chats && chats[chat] && chats[chat].map((message, index)=> {
                return <ListGroup.Item key={index} className="border-0 text-start"><span className={message.sender.startsWith("You") ? "text-primary" : "text-danger"}>{message.sender}:</span> {message.message}</ListGroup.Item>;
            })}
            <ListGroup.Item className="border-0 text-start"><span maxheight={"0px"} ref={scroll}></span></ListGroup.Item>
            </ListGroup>
            <InputGroup  className="mb-3">
                <Form.Control
                    placeholder="Type message..."
                    aria-label="Message"
                    id="message"
                    value={message}
                    onKeyDown={handleKeyDown}
                    disabled={chat === ""}
                    onChange={(event) => { setMessage(event.target.value) }}
                />
                <Button disabled={chat === ""} variant="primary" id="send" onClick={onClick}><Send /></Button>
            </InputGroup>
            </Col>
            </Row>
        </div>
    )
}

export default Chat;