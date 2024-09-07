import { ListGroup, Row, Col } from "react-bootstrap";
import { SendIcon } from "lucide-react";
import { useEffect, useState, useRef, useContext } from "react";
import { AppContext } from "../contexts/AppContext.jsx";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

function Chat() {
  const { messages, sendMessage } = useContext(AppContext);

  const [message, setMessage] = useState("");

  const [chat, setChat] = useState("");

  const refreshChats = () => {
    let newChats = {
      "(New Chat)": [],
      admin: [],
    };

    messages.forEach((msg) => {
      let _chat = msg.sender.replace("You (to ", "").replace(")", "");
      if (!(_chat in newChats)) {
        newChats[_chat] = [];
      }
      newChats[_chat].push({
        sender: msg.sender.startsWith("You") ? "You" : msg.sender,
        message: msg.message,
      });
    });
    return newChats;
  };

  const [chats, setChats] = useState(refreshChats());

  const onClick = (event) => {
    if (chat !== "(New Chat)") {
      sendMessage("/" + chat.toLowerCase() + " " + message);
    } else if (chat !== "") {
      setChat(message.split(" ")[0].substring(1));
      sendMessage(message);
    }
    setMessage("");
  };

  useEffect(() => {
    scroll.current.scrollIntoView({ behavior: "smooth" });
    setChats(refreshChats());
  }, [messages]);

  const handleKeyDown = (e) => {
    if (showCommands) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) =>
            (prev - 1 + filteredCommands.length) % filteredCommands.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        setMessage("/" + filteredCommands[selectedIndex].name + " ");
        setShowCommands(false);
        inputRef.current?.focus();
      }
    } else if (e.key === "Enter") {
      onClick();
    }
  };

  const commands = [
    { name: "away", description: "Set your status as away" },
    { name: "dnd", description: "Enable Do Not Disturb mode" },
    { name: "invite", description: "Invite someone to the channel" },
    { name: "remind", description: "Set a reminder" },
    { name: "shrug", description: "Append ¯\\_(ツ)_/¯ to your message" },
  ];

  const [showCommands, setShowCommands] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState(commands);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef();

  const scroll = useRef();

  useEffect(() => {
    if (chat == "(New Chat)" && message.startsWith("/")) {
      setShowCommands(true);
      const filtered = commands.filter((cmd) =>
        cmd.name.toLowerCase().startsWith(message.slice(1).toLowerCase())
      );
      setFilteredCommands(filtered);
      setSelectedIndex(0);
    } else {
      setShowCommands(false);
    }
  }, [message]);

  return (
    <div style={{ textAlign: "left" }}>
      <h1>Chat</h1>
      <Row>
        <Col md={5}>
          <ListGroup>
            {chats &&
              Object.keys(chats).map((chatName) => {
                return (
                  <ListGroup.Item
                    key={chatName}
                    action
                    active={chatName === chat}
                    onClick={() => {
                      setChat(chatName);
                      setShowCommands(false);
                    }}
                  >
                    {chatName}
                    <br></br>
                    <i>
                      {chats[chatName].at(-1) &&
                        (chats[chatName].at(-1).sender === "You"
                          ? "You: "
                          : "") + chats[chatName].at(-1).message}
                    </i>
                  </ListGroup.Item>
                );
              })}
          </ListGroup>
        </Col>
        <Col>
          <div
            style={{ minHeight: "50vh" }}
            className="w-full p-4 flex flex-col justify-end"
          >
            <ListGroup
              className=" bg-gray-900"
              style={{ maxHeight: "50vh", overflowY: "auto" }}
            >
              {chats &&
                chats[chat] &&
                chats[chat].map((message, index) => {
                  return (
                    <ListGroup.Item
                      key={index}
                      className="bg-gray-900 border-0 text-start"
                    >
                      <span
                        className={
                          message.sender.startsWith("You")
                            ? "text-primary"
                            : "text-danger"
                        }
                      >
                        {message.sender}:
                      </span>{" "}
                      {message.message}
                    </ListGroup.Item>
                  );
                })}
              <ListGroup.Item
                style={{ display: "none" }}
                className="border-0 text-start"
              >
                <span
                  className=" bg-gray-900"
                  maxheight={"0px"}
                  ref={scroll}
                ></span>
              </ListGroup.Item>
            </ListGroup>

            <div className="w-full relative">
              <div className="absolute bottom-full w-full mb-2">
                {showCommands && (
                  <ScrollArea className="w-full bg-white border border-gray-700 rounded-lg shadow-lg max-h-60">
                    {filteredCommands.map((cmd, index) => (
                      <div
                        key={cmd.name}
                        className={`p-3 cursor-pointer ${
                          index === selectedIndex
                            ? "bg-blue-100"
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          setMessage("/" + cmd.name + " ");
                          setShowCommands(false);
                          inputRef.current?.focus();
                        }}
                      >
                        <span className="font-bold text-gray-800">
                          /{cmd.name}
                        </span>
                        <span className="ml-2 text-gray-600">
                          {cmd.description}
                        </span>
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </div>
              <div className="flex items-stretch">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    "Type a message" +
                    (chat == "(New Chat)" ? " or / for recipients" : "")
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-grow py-2 px-3 bg-white text-gray-800 border-2 !rounded-r-none !border-r-0 border-gray-300 rounded-l-lg !focus:outline-none placeholder-gray-400"
                />
                <Button
                  disabled={chat === ""}
                  variant="primary"
                  id="send"
                  onClick={onClick}
                  className="px-4 bg-blue-500 hover:bg-blue-600 text-white !rounded-l-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 border-2 border-blue-500"
                >
                  <SendIcon className="h-5 w-5" />
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default Chat;
